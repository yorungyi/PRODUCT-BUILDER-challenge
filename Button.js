class CustomButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', 'styles.css');

        this.button = document.createElement('button');
        this.shadowRoot.append(link, this.button);
    }

    connectedCallback() {
        this.render();
        this.button.addEventListener('click', (e) => {
            const form = this.closest('form');

            // If inside a <form method="dialog">, close the parent dialog.
            if (form && form.method === 'dialog') {
                const dialog = this.closest('dialog');
                if (dialog) {
                    dialog.close();
                }
                return; // Action is complete.
            }

            // If the button is a submit button, find the parent form and submit it.
            if (this.getAttribute('type') === 'submit') {
                if (form) {
                    e.preventDefault(); // Prevent default button action.
                    // Create a temporary submit button to trigger form submission.
                    const tempSubmit = document.createElement('button');
                    tempSubmit.type = 'submit';
                    tempSubmit.style.display = 'none';
                    form.appendChild(tempSubmit);
                    tempSubmit.click();
                    form.removeChild(tempSubmit);
                }
            } else {
                 // For other non-submit, non-dialog buttons, dispatch a click event.
                 this.dispatchEvent(new MouseEvent('click', {
                    bubbles: true,
                    composed: true,
                }));
            }
        });
    }
    
    render() {
        this.button.textContent = this.getAttribute('label');
        this.button.className = this.getAttribute('variant') || '';
        this.button.disabled = this.hasAttribute('disabled');
        this.button.setAttribute('type', 'button'); // Set as a basic button to prevent unwanted default form submissions.
    }

    static get observedAttributes() {
        return ['label', 'variant', 'disabled', 'type'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.render();
    }
}

customElements.define('custom-button', CustomButton);
