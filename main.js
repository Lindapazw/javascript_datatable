class DataTable{
    element;
    headers;
    items;
    copyItems;
    selected;
    pagination;
    numberOfEntries;
    headerButtons;

    constructor(selector, headerButtons){
        this.element = document.querySelector(selector);

        this.headers = [];
        this.items = [];
        this.pagination = {
            total:0, 
            noItemsPerPage:0, 
            noPages: 0, 
            actual: 0, 
            pointer: 0, 
            diff:0,
            lastPageBeforeDots:0,
            noButtonsBeforeDots: 4
        };

        this.selected = [];
        this.numberOfEntries = 5;
        this.headerButtons = headerButtons;
    } // fin de constructor

    parse() {
        const headers = [... this.element.querySelector('thead tr').children];
        const trs = [... this.element.querySelector('tbody').children];

        headers.forEach(element => {
            this.headers.push(element.textContent); // recorre por fila
        }); // trae el array para el headers

        trs.forEach(tr => {
            const cells = [ ... tr.children];

            const item = {
                id: this.generateUUID(), // genera un ID 
                values: []
            };

            cells.forEach(cell => {
                if(cell.children.length > 0 ){
                    // const status =  [... cell.children][0].getAtribute('class');
                    const statusElement = [... cell.children][0];
                    const status = statusElement.getAttribute('class');
                    if(status != null ){
                        item.values.push(`<span class='${status}'></span>`);
                    }
                } else {
                    item.values.push(cell.textContent);
                }
            });

            this.items.push(item);
        }); 

        console.log(this.items);

        this.makeTable(); 
    }

    makeTable(){
        this.copyItems = [... this.items];

        this.initPagination(this.items.length, this.numberOfEntries);

        const container = document.createElement('div');
        container.id = this.element.id;
        this.element.innerHTML = '';
        this.element.replaceWith(container); // remplazo la tabla con el nuevo div
        this.element = container;

        // definicion de funciones
        this.createHTML();
        this.renderHeaders();
        this.renderRows();
        this.renderPagesButtons();
        this.renderHeadersButtons();
        this.renderSearch();  // dibuja la busqueda
    }

    initPagination(total, entries){
        this.pagination.total = total;
        this.pagination.noItemsPerPage = entries;
        this.pagination.noPages = Math.ceil(this.pagination.total / this.pagination.noItemsPerPage);
        this.pagination.actual = 1;
        this.pagination.pointer = 0;
        this.pagination.diff = this.pagination.noItemsPerPage - (this.pagination.total % this.pagination.noItemsPerPage)
    }

    generateUUID(){
        return (Date.now() * Math.floor(Math.random() * 100000)).toString();
    }

    createHTML(){
        this.element.innerHTML = `
        <div class="datatable-container">
            <div class= "header-tools">
                <div class="tools">
                    <ul class="header-buttons-container">
                    </ul>
                </div>
                <div class="search">
                    <input type="text" class="search-input" placeholder="Buscador">
                </div>
            </div>
            <table class="datatable">
                <thead>
                    <tr>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
            <div class="footer-tools">
                <div class="list-items">
                    Show
                    <select name="n-entries" id="n-enties" class="n-entries">
                    </select>
                    entries
                </div>

                <div class="pages">
                <div>
            </div>
        </div>
        `;
    }

    // renderiza el header
    renderHeaders(){
        this.element.querySelector('thead tr').innerHTML = '';

        this.headers.forEach(header => {
            this.element.querySelector('thead tr').innerHTML += `<th>${header}</th>`;
        });
    }

    // renderiza cada fila
    renderRows(){
        this.element.querySelector('tbody').innerHTML = '';

        let i = 0;
        const {pointer, total} = this.pagination;
        const limit = this.pagination.actual * this.pagination.noItemsPerPage;

        for( i = pointer; i < limit; i++){
            if(i == total) break;

            const {id, values} = this.copyItems[i];
            const checked = this.isChecked(id);

            let data = '';

            data += `<td class="table-checkbox">
                        <input type="checkbox" class="datatable-checkbox" data-id="${id}" ${checked? "checked":""} />
                    </td>`;

            values.forEach(cell => {
                data += `<td>${cell}</td>`;
            });

            this.element.querySelector('tbody').innerHTML += `<tr>${data}</tr>`;

            //listener para el checkbox
            document.querySelectorAll('.datatable-checkbox').forEach(checkbox  => {
                checkbox.addEventListener('click', e => {
                    const element = e.target;
                    const id= element.getAttribute('data-id');

                    if(element,checkbox){
                        const item = this.getItem(id);
                        this.selected.push(item);
                    }else{
                        this.removeSelected(id);
                    }

                    // ** vemos en consola cada fila seleccionada **
                    console.log(this.selected);
                });
            });
        }
    }

    // valido si el elemento seleccionado existe 
    isChecked(id){
        const items = this.selected;
        let res = false;

        if(items.length == 0 ) return false;

        items.forEach(item => {
            if(item.id == id) res = true;
        });

        return res;
    }

    // Esta funsion sale de renderRows
    getItem(id){
        const res = this.items.filter( item => item.id == id );
        if(res.length == 0) return null;
        return res[0];
    }

    // Esta funsion sale de renderRows
    removeSelected(id){
        const res = this.selected.filter(item => item.id != id);
        this.selected =[... res];
    }

    renderPagesButtons(){
        const pagesContainer = this.element.querySelector('.pages');
        let pages = ''; 

        const buttonsToShow = this.pagination.noButtonsBeforeDots;
        const actualIndex = this.pagination.actual;

        let limI = Math.max(actualIndex - 2, 1);
        let limS = Math.min(actualIndex + 2, this.pagination.noPages);
        const missinButtons = buttonsToShow - (limS - limI);

        if(Math.max(limI - missinButtons, 0)){
            limI = limI - missinButtons;
        } else if(Math.min(limS + missinButtons, this.pagination.noPages) != this.pagination.noPages){
            limS =limS + missinButtons;
        }

        if(limS < (this.pagination.noPages - 2)){
            pages += this.getIteratedButton(limI, limS);
            pages += '<li> ... </li>';
            pages += this.getIteratedButton(this.pagination.noPages - 1, this.pagination.noPages);
        } else {
            pages += this.getIteratedButton(limI, this.pagination.noPages);
        }

        pagesContainer.innerHTML = `<ul>${pages}<ul>`;

        //mostrar eventos
        this.element.querySelectorAll('.pages li button').forEach(button =>{
            button.addEventListener('click', e =>{
                this.pagination.actual = parseInt(e.target.getAttribute('data-page'));
                this.pagination.pointer = (this.pagination.actual * this.pagination.noItemsPerPage) -this.pagination.noItemsPerPage;
                this.renderRows();
                this.renderPagesButtons();
            });
        });
    }

    // Esta funsion sale de renderPagesButtons
    getIteratedButton(start, end){
        let res = '';
        for(let i = start; i <= end; i++){
            if(i == this.pagination.actual){
                res += `<li><span class="active">${i}</span></li>`;
            } else{
                res += `<li><button data-page="${i}">${i}</button></li>`;
            }
        }

        return res;
    }

    renderHeadersButtons(){
        let html = ''; 
        const buttonsContainer = this.element.querySelector('.header-buttons-container');
        const headerButtons = this.headerButtons;

        headerButtons.forEach(button =>{ // cambiar icon 
            html += `
                    <li>
                        <button id="${button.id}">
                            <i class="material-symbols-outlined">
                            ${button.icon}
                            </i>
                        </button>
                    </li>
                    `;
        });

        buttonsContainer.innerHTML = html;

        headerButtons.forEach(button => {
            document.querySelector('#' + button.id).addEventListener('click', button.action)
        });
    }

    renderSearch(){
        this.element.querySelector('.search-input').addEventListener('input', e => {
            const query = e.target.value.trim().toLowerCase();

            if(query == ''){
                this.copyItems = [ ... this.items]; // muestra todos los items
                this.initPagination(this.copyItems.length, this.numberOfEntries);
                this.renderRows();
                this.renderPagesButtons();
                return;
            }

            this.search(query);

            this.initPagination(this.copyItems.length, this.numberOfEntries);
            this.renderRows();
            this.renderPagesButtons();
        });
    }

    // Esta funsion sale de renderSearch
    search(query){
        let res = [];

        this.copyItems =  [... this.items];

        for(let i = 0; i < this.copyItems.length; i++){
            const {id, values} = this.copyItems [i];
            const row = values;

            for(let j = 0; j < row.length; j++){
                const cell = row[j];

                if(cell.toLowerCase().indexOf(query) >= 0){
                    res.push(this.copyItems[i]);
                    break;
                }
            }
        }

        this.copyItems = [ ... res];
    }

    getSelected(){
        return this.selected;
    }

    add(item){
        const row = {
            id: this.generateUUID(),
            values:[]
        };

        const status = `<span class="${item[0]}"></span>`;
        item.shift();
        row.values = [status, ... item];
        this.items = [row, ... this.items];
        this.makeTable();
    }
}

