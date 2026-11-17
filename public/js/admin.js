window.adminRequest = async function (url, options = {}) {
    const response = await fetch(url, {
        credentials: 'same-origin', cache: 'no-store', ...options,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content, ...(options.headers || {}) },
    });
    let body;
    try { body = await response.json(); } catch { throw Error('A munkamenet lejárt vagy a szerver nem érhető el. Frissítsd az oldalt.'); }
    if (!response.ok) {
        const message = response.status === 422 ? Object.values(body.errors || {}).flat().join(' ') :
            response.status === 409 ? body.message : response.status === 401 || response.status === 419 ? 'A munkamenet lejárt. Frissítsd az oldalt és jelentkezz be.' : 'A művelet nem sikerült. Próbáld újra.';
        const error = Error(message); error.status = response.status; throw error;
    }
    return body;
};
document.querySelectorAll('form[data-confirm]').forEach(form => {
    form.addEventListener('submit', event => { if (!window.confirm(form.dataset.confirm)) event.preventDefault(); });
});
document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('cancel', event => { if (dialog.dataset.busy === 'true') event.preventDefault(); });
});
document.querySelectorAll('[data-close-dialog]').forEach(button => {
    button.addEventListener('click', () => {
        const dialog = document.getElementById(button.dataset.closeDialog);
        if (dialog.dataset.busy !== 'true') dialog.close();
    });
});

const addressList = document.getElementById('route-address-list');
const addressFilter = document.getElementById('address-filter');
function filterAddresses() {
    const query = addressFilter.value.trim().toLocaleLowerCase('hu-HU');
    addressList.querySelectorAll('[data-address-search]').forEach(row => { row.hidden = !row.dataset.addressSearch.includes(query); });
}
if (addressFilter) addressFilter.addEventListener('input', filterAddresses);
if (addressList) {
    function renumber() {
        addressList.querySelectorAll('[data-address-id]').forEach((row, index) => {
            row.querySelector('[data-order-number]').textContent = index + 1;
            row.querySelector('input[name^="orders["]').value = index + 1;
        });
        document.getElementById('address-order-status').textContent = 'Sorrend módosítva. A Mentés gombbal rögzíthető.';
    }
    let dragging = null;
    addressList.addEventListener('pointerdown', event => {
        const handle = event.target.closest('.drag-handle');
        if (!handle || event.button !== 0) return;
        dragging = handle.closest('[data-address-id]');
        handle.setPointerCapture(event.pointerId);
        dragging.classList.add('dragging');
        event.preventDefault();
    });
    addressList.addEventListener('pointermove', event => {
        if (!dragging) return;
        const target = document.elementsFromPoint(event.clientX, event.clientY)
            .map(element => element.closest('[data-address-id]')).find(row => row && row !== dragging && addressList.contains(row));
        if (target) {
            const rect = target.getBoundingClientRect();
            addressList.insertBefore(dragging, event.clientY < rect.top + rect.height / 2 ? target : target.nextSibling);
            dragging.querySelector('.drag-handle').setPointerCapture(event.pointerId);
        }
        if (event.clientY < 100) window.scrollBy(0, -18);
        else if (event.clientY > window.innerHeight - 100) window.scrollBy(0, 18);
    });
    function finishDrag() {
        if (!dragging) return;
        dragging.classList.remove('dragging'); dragging = null; renumber();
    }
    addressList.addEventListener('pointerup', finishDrag);
    addressList.addEventListener('pointercancel', finishDrag);
    addressList.addEventListener('lostpointercapture', finishDrag);
    addressList.addEventListener('keydown', event => {
        if (!event.target.closest('.drag-handle') || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        const row = event.target.closest('[data-address-id]');
        const rows = Array.from(addressList.children).filter(item => !item.hidden);
        const index = rows.indexOf(row);
        const target = rows[index + (event.key === 'ArrowUp' ? -1 : 1)];
        if (!target) return;
        addressList.insertBefore(row, event.key === 'ArrowUp' ? target : target.nextSibling);
        row.querySelector('.drag-handle').focus(); renumber();
    });

    function newAddressRow(address) {
        const row = document.createElement('div');
        row.className = 'address-option'; row.dataset.addressId = address.id;
        row.dataset.addressSearch = [address.box_code, address.address, address.city].join(' ').toLocaleLowerCase('hu-HU');
        const handle = document.createElement('button');
        handle.type = 'button'; handle.className = 'drag-handle secondary'; handle.textContent = '☰';
        handle.setAttribute('aria-label', address.box_code + ' mozgatása, fel és le nyíllal is');
        const order = document.createElement('span'); order.className = 'order-number'; order.dataset.orderNumber = ''; order.textContent = address.sort_order;
        const attach = document.createElement('label'); attach.className = 'address-attach';
        const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.name = 'address_ids[]'; checkbox.value = address.id; checkbox.checked = true;
        const text = document.createElement('span'), title = document.createElement('strong'), detail = document.createElement('small');
        title.textContent = address.address; detail.textContent = address.box_code + ' · ' + address.city; text.append(title, detail); attach.append(checkbox, text);
        const exempt = document.createElement('label'); exempt.className = 'exempt-toggle';
        const exemptBox = document.createElement('input'); exemptBox.type = 'checkbox'; exemptBox.name = 'exempt_ids[]'; exemptBox.value = address.id; exemptBox.checked = address.is_exempt;
        exempt.append(exemptBox, document.createTextNode(' Mentesített'));
        const position = document.createElement('input'); position.type = 'hidden'; position.name = 'orders[' + address.id + ']'; position.value = address.sort_order;
        const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'secondary address-edit-button'; edit.dataset.editAddress = address.id; const editIcon = document.createElement('i'); editIcon.className = 'fi fi-rr-edit'; editIcon.setAttribute('aria-hidden', 'true'); const editText = document.createElement('span'); editText.textContent = 'Szerkesztés'; edit.append(editIcon, editText); edit.setAttribute('aria-label', address.box_code + ' szerkesztése');
        row.append(handle, order, attach, exempt, edit, position); return row;
    }
    const opener = document.getElementById('address-create-open');
    if (opener) {
        const dialog = document.getElementById('address-create-dialog');
        const form = document.getElementById('address-create-form');
        let editId = null, originalOrder = 1;
        const title = document.getElementById('address-create-title');
        const submit = form.querySelector('button[type=submit]');
        opener.addEventListener('click', () => {
            editId = null; form.reset(); form.elements.delivery_route_id.value = form.dataset.routeId;
            title.textContent = 'Új cím'; submit.textContent = 'Cím létrehozása'; submit.disabled = false;
            document.getElementById('address-create-status').textContent = ''; dialog.showModal();
        });
        addressList.addEventListener('click', async event => {
            const button = event.target.closest('[data-edit-address]'); if (!button) return;
            editId = button.dataset.editAddress; form.reset();
            title.textContent = 'Cím szerkesztése'; submit.textContent = 'Cím mentése';
            const status = document.getElementById('address-create-status'); status.textContent = 'Adatok betöltése…';
            dialog.showModal(); dialog.dataset.busy = 'true'; dialog.querySelectorAll('button').forEach(button => { button.disabled = true; });
            try {
                const address = await window.adminRequest('/admin/address-data/' + editId);
                for (const name of ['box_code','address','city','location','deadline_hour','delivery_route_id']) form.elements[name].value = address[name] ?? '';
                form.elements.is_exempt.checked = address.is_exempt; originalOrder = address.sort_order; status.textContent = '';
                submit.disabled = false;
            } catch (error) { status.textContent = error.message; }
            finally {
                dialog.dataset.busy = 'false';
                dialog.querySelectorAll('[data-close-dialog]').forEach(button => { button.disabled = false; });
            }
        });
        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (dialog.dataset.busy === 'true') return;
            const payload = Object.fromEntries(new FormData(form)); payload.is_exempt = form.elements.is_exempt.checked;
            if (editId) payload.sort_order = originalOrder;
            dialog.dataset.busy = 'true';
            dialog.querySelectorAll('button').forEach(button => { button.disabled = true; });
            const status = document.getElementById('address-create-status'); status.textContent = 'Mentés…';
            try {
                const address = await window.adminRequest('/admin/addresses' + (editId ? '/' + editId : ''), { method: editId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
                const row = newAddressRow(address);
                if (editId) {
                    const old = addressList.querySelector('[data-address-id="' + editId + '"]');
                    row.querySelector('input[name="address_ids[]"]').checked = old.querySelector('input[name="address_ids[]"]').checked;
                    row.querySelector('input[name^="orders["]').value = old.querySelector('input[name^="orders["]').value;
                    row.querySelector('[data-order-number]').textContent = old.querySelector('[data-order-number]').textContent;
                    old.replaceWith(row);
                } else { addressList.append(row); renumber(); }
                addressFilter.value = ''; filterAddresses(); document.getElementById('address-list-empty').hidden = true;
                document.getElementById('address-order-status').textContent = (editId ? 'Cím módosítva.' : 'Új cím létrehozva.') + ' Az útvonal további módosításait a Mentés gombbal rögzítheted.';
                dialog.close();
            } catch (error) { status.textContent = error.message; }
            finally { dialog.dataset.busy = 'false'; dialog.querySelectorAll('button').forEach(button => { button.disabled = false; }); }
        });
    }
}
document.querySelectorAll('.notify-form').forEach(form => {
    form.addEventListener('submit', async event => {
        if (event.defaultPrevented) return;
        event.preventDefault();
        if (form.dataset.busy === 'true') return;
        const payload = Object.fromEntries(new FormData(form));
        const dialog = form.closest('dialog'), status = form.querySelector('.notify-status');
        form.dataset.busy = 'true'; if (dialog) dialog.dataset.busy = 'true';
        const controls = dialog || form;
        controls.querySelectorAll('button').forEach(button => { button.disabled = true; });
        status.textContent = 'Küldés…';
        try {
            await window.adminRequest('/admin/notifications', {method:'POST', body:JSON.stringify(payload)});
            status.textContent = 'Értesítés elküldve.';
            form.elements.request_id.value = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => { const value = Math.floor(Math.random() * 16); return (char === 'x' ? value : (value & 3) | 8).toString(16); });
            if (dialog) { dialog.close(); document.getElementById('calendar-status').textContent = 'Beosztás módosítási értesítés elküldve.'; }
            if (form.dataset.reload === 'true') window.location.reload();
        } catch (error) { status.textContent = error.message; }
        finally {
            form.dataset.busy = 'false'; if (dialog) dialog.dataset.busy = 'false';
            controls.querySelectorAll('button').forEach(button => { button.disabled = false; });
        }
    });
});
