import {PolymerElement, html} from '../../node_modules/@polymer/polymer/polymer-element.js';

    customElements.define('cr-domain-experimental', class extends PolymerElement {
      static get is() { return 'cr-domain-experimental'; }
      static get properties() {
        return {
          item: Object
        }
      }
      static get template() {
        return html`
        <style>
      [hidden] {
        display: none !important;
      }

      span.experimental {
        font-size: 70%;
        text-transform: uppercase;
        background-color: #E57373;
        padding: 2px;
        cursor: help;
        color: white;
        vertical-align: baseline;
        font-weight: normal;
        font-family: inherit;
      }
      span.deprecated {
        background-color: #FFCC80;
        color: black;
        border: 1px solid #EF6C00;
      }

      .domain-experimental span.experimental {
        display: none;
      }

      .domain-experimental .heading-domain span.experimental {
        display: inline-block;
      }

      .domain-experimental .heading-domain {
        border: 1px solid #E57373;
      }
    </style>
    <span class="experimental" hidden$="[[!item.experimental]]" title="This may be changed, moved or removed">Experimental</span>

    <span class="experimental deprecated" hidden$="[[!item.deprecated]]" title="Deprecated, please adopt alternative">Deprecated</span>`;
      }
    });