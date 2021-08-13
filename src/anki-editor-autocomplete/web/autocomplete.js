var Autocomplete = {
    acByField : null,
    optionsByField : null,
    enabledFields: [],
    icons: [],

    setup: (enabledFields) => {
        Autocomplete.enabledFields = enabledFields
        Autocomplete.setupAcs(enabledFields)
        Autocomplete.setupIcons(enabledFields)
    },

    update: (data) => {
        var { ord, options } = data
        Autocomplete.optionsByField.set(ord, options)
    }, 

    setupAcs: (enabledFields) => {

        if (Autocomplete.acByField != null){
            for(let ord of Autocomplete.acByField.keys()){
                Autocomplete.removeAc(ord)
            }
        }

        Autocomplete.acByField = new Map()
        Autocomplete.optionsByField = new Map()

        forEditorField([], (field) => {

            var ord = field.editingArea.ord
            if(!(enabledFields.includes(ord))) return
            
            Autocomplete.addAc(ord)

        })
    },

    addAc: (ord) => {
        var field = globalThis.getEditorField(ord)
        var editable = field.editingArea.editable

        style = document.createElement("style")
        style.innerHTML = css
        field.editingArea.shadowRoot.insertBefore(style, editable)

        var ac = new autoComplete({ 
            selector: () => { return editable },
            data: {
                src: () => { return Autocomplete.optionsByField.get(ord) },
                filter: (options) => {
                    var result = options.filter( x => x.value.replace(' ', '') != '' )
                    return result
                },
            },
            resultItem: {
                highlight: {
                    render: true
                }
            },
            wrapper: false,
            events: {
                input: {
                    init: (event) => {
                        globalThis.bridgeCommand(`autocomplete:{ "ord": ${ord} }`)
                    },
                    focus: (event) => {
                        ac.start();
                    },
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        editable.fieldHTML = selection;
                    },
                },
            },
            threshold: 0,
            resultsList: {
                tag: "ul",
                class: "autoComplete_results",
                tabSelect: true,
                noResults: true,
                element: (list, data) => {
                    if (!data.results.length) {
                        const message = document.createElement("div");
                        message.setAttribute("class", "no_result");
                        message.innerHTML = `<span>no results</span>`;
                        list.appendChild(message);
                    }
                },
                // position: "afterend",
                // maxResults: 5,
            },
            query: (input) => {
                return input.replace("<br>", "");
            },
        })

        Autocomplete.acByField.set(ord, ac)
        Autocomplete.optionsByField.set(ord, [])
    },

    removeAc: (ord) => {
        var ac = Autocomplete.acByField.get(ord)
        ac.unInit()
        delete ac

        Autocomplete.acByField.delete(ord)
        Autocomplete.optionsByField.delete(ord)
    },

    toggleAc: (ord) => {
        if(Autocomplete.enabledFields.includes(ord)){
            Autocomplete.enabledFields.splice(Autocomplete.enabledFields.indexOf(ord), 1)
            Autocomplete.icons[ord].classList.remove('enabled')
            Autocomplete.icons[ord].classList.add('disabled')
            Autocomplete.removeAc(ord)
            globalThis.bridgeCommand(`update_ac_settings:{"ord" : ${ord}, "val" : false}`)
        } else {
            Autocomplete.enabledFields.push(ord)
            Autocomplete.icons[ord].classList.remove('disabled')
            Autocomplete.icons[ord].classList.add('enabled')
            Autocomplete.addAc(ord)
            globalThis.bridgeCommand(`update_ac_settings:{"ord" : ${ord}, "val" : true}`)
        }
    },

    setupIcons: (enabledFields) => {

        for(let icon of Autocomplete.icons){
            icon.remove()
        }
        Autocomplete.icons = []

        forEditorField([], (field) => {
            const ord = field.editingArea.ord

            const icon = document.createElement('span')
            icon.classList.add('ac-icon')
            icon.addEventListener('click', () => {
                Autocomplete.toggleAc(ord)
            })
            Autocomplete.addIconToPage(field, icon)
            Autocomplete.icons.push(icon)

            if(enabledFields.includes(ord)){
                icon.classList.add('enabled')
            } else {
                icon.classList.add('disabled')
            }
        })
    },

    addIconToPage: (field, icon) => {
        field.labelContainer.insertBefore(icon, field.labelContainer.label.nextSibling)
        field.labelContainer.style.setProperty("justify-content", "flex-end")

        // move label back to the left
        field.labelContainer.label.style.setProperty("margin-right", "auto")
    },

}


css = `
.no_result {
    padding: 10px 20px;
    list-style: none;
    text-align: left;
    font-size: 13px;
    color: #212121;
    transition: all .1s ease-in-out;
    border-radius: 3px;
    background-color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all .2s ease
}

.autoComplete_results {
    max-height: 226px;
    overflow-y: scroll;
    top: 100%;
    left: 0;
    right: 0;
    padding: 0;
    margin: .5rem 0 0 0;
    border-radius: 4px;
    background-color: #fff;
    border: 1px solid rgba(33, 33, 33, .1);
    z-index: 1000;
    outline: 0
}

.autoComplete_results>li {
    padding: 10px 20px;
    list-style: none;
    text-align: left;
    font-size: 16px;
    color: #212121;
    transition: all .1s ease-in-out;
    border-radius: 3px;
    background-color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all .2s ease
}

.autoComplete_results>li::selection {
    color: rgba(#fff, 0);
    background-color: rgba(#fff, 0)
}

.autoComplete_results>li:hover {
    cursor: pointer;
    background-color: rgba(123, 123, 123, .1)
}

.autoComplete_results>li mark {
    background-color: transparent;
    color: #ff7a7a;
    font-weight: 700
}

.autoComplete_results>li mark::selection {
    color: rgba(#fff, 0);
    background-color: rgba(#fff, 0)
}

.autoComplete_results>li[aria-selected=true] {
    background-color: rgba(123, 123, 123, .1)
}

`