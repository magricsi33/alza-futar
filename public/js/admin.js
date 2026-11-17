document.querySelectorAll('form[data-confirm]').forEach(form => {
    form.addEventListener('submit', event => { if (!window.confirm(form.dataset.confirm)) event.preventDefault(); });
});
const filter = document.getElementById('address-filter');
if (filter) filter.addEventListener('input', () => {
    const query = filter.value.trim().toLocaleLowerCase('hu-HU');
    document.querySelectorAll('[data-address-search]').forEach(row => { row.hidden = !row.dataset.addressSearch.includes(query); });
});
