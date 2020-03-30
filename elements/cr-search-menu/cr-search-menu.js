import {PolymerElement, html} from '../../node_modules/@polymer/polymer/polymer-element.js';
import '../../node_modules/@polymer/iron-list/iron-list.js';
import '../../node_modules/@polymer/iron-icon/iron-icon.js';
import '../../node_modules/@polymer/iron-icons/image-icons.js';
import '../cr-html-echo/cr-html-echo.js';

(function() {
  var SITE_ROOT = '/devtools-protocol/';

  class CRSearchMenu extends PolymerElement {
    static get properties() {
      return {
        keywordsModel: {
          type: Object
        },
        searchString: {
          type: String,
          value: ''
        },
        renderItems: {
          type: Array,
          readOnly: true,
          value: [],
          observer: 'handleRenderItemsChange_'
        },
        highlightedResultIdx: {
          type: Number,
          value: -1
        },
        empty_: {
          type: Boolean,
          empty: false
        }
      };
    }

    static get observers() {
      return [
        'renderItems_(keywordsModel, searchString)'
      ];
    }

    static get template() {
      return html`
          <style>
      :host {
        --border-width: 1px;
        height: calc(100vh - 2 * var(--main-content-padding) - var(--header-height) - 2 * var(--border-width));
        display: flex;
        border: var(--border-width) solid #ccc;
        box-shadow: 0 1px 3px 2px rgba(0, 0, 0, 0.15);
        background-color: white;
      }
      [hidden] {
        display: none !important;
      }
      iron-list {
        padding: 11px 0;
        width: 100%;
        flex: 1;
      }
      .match-info {
        @apply --layout-vertical;
        flex: 1 auto;
      }
      .search-match {
        padding: 8px 16px;
        text-decoration: none;
        font-weight: 200;
        @apply --layout-horizontal;
        width: 100%;
        cursor: pointer;
      }
      iron-icon {
        width: 36px;
        height: 36px;
        padding-right: 10px;
        fill: #4e4e4e;
        -ms-flex-shrink: 0;
        -webkit-flex-shrink: 0;
        flex-shrink: 0;
      }
      .match-label {
        @apply --layout-horizontal;
      }
      .match-description {
        @apply --layout-flex-auto;
        margin-top: 3px;
      }
      .label {
        @apply --layout-flex-auto;
        font-size: 18px;
      }
      a {
        text-decoration: none;
        color: #383838;
      }
      .domain-tag {
        @apply --layout-flex-none;
        text-align: right;
      }
      .label .type, .domain-label {
        color: #3A3A3A;
        font-size: 14px;
      }
      .search-match:hover, .search-match--active {
        background-color: #E8F0FF;
      }
      .empty-state-message {
        margin: 0;
        padding: 35px;
        text-align: center;
      }
    </style>
    <slot name="header"></slot>
    <p class="empty-state-message" hidden$="[[!empty_]]">
      No matches. Try another search.
    </p>
    <iron-list id="ironList" items="[[renderItems]]" as="match" hidden$="[[empty_]]">
      <template>
        <a href$="[[computeMatchHref_(match)]]" class$="search-match [[highlightedClass(match.selected)]]" role="menuitem" on-click="activateItem_">
          <iron-icon icon="[[match.icon]]"></iron-icon>
          <div class="match-info">
            <div class="match-label">
              <div class="label">
                <span>[[match.label]]</span>
                <span class="type">[[match.typeLabel]]</span>
              </div>
              <div class="domain-tag" hidden$="[[isDomainType_(match.type)]]">
                <span class="domain-label">Domain</span>
                <span>[[match.domain]]</span>
              </div>
            </div>
            <div class="match-description">
              <cr-html-echo html="[[match.description]]"></cr-html-echo>
            </div>
          </div>
        </a>
      </template>
    </iron-list>
    <slot name="footer"></slot>`;
    }

    highlightedClass(selected) {
      return selected ? 'search-match--active' : '';
    }

    highlightNextResult() {
      if (this.highlightedResultIdx >= this.renderItems.length) {
        return;
      }

      this.set('renderItems.' + this.highlightedResultIdx + '.selected', false);
      this.highlightedResultIdx++;
      this.set('renderItems.' + this.highlightedResultIdx + '.selected', true);

      this.showHighlightedResult_();
    }

    highlightPreviousResult() {
      if (this.highlightedResultIdx <= 0) {
        return;
      }

      this.set('renderItems.' + this.highlightedResultIdx + '.selected', false);
      this.highlightedResultIdx--;
      this.set('renderItems.' + this.highlightedResultIdx + '.selected', true);

      this.showHighlightedResult_();
    }

    showHighlightedResult_() {
      var selected = this.shadowRoot.querySelectorAll('.search-match--active');
      if (!selected) {
        return;
      }
      if (selected.scrollIntoViewIfNeeded) {
        selected.scrollIntoViewIfNeeded(false);
      } else if (selected.scrollIntoView) {
        selected.scrollIntoView(false);
      }
    }

    chooseHighlightedResult() {
      var selectedItem = this.renderItems[this.highlightedResultIdx];
      if (selectedItem) {
        if (selectedItem.href) {
          history.pushState({}, '', selectedItem.href);
          this.dispatchEvent(new CustomEvent('location-changed', { bubbles: true, composed: true}));
        }
        this.activateItem_();
      }
    }

    activateItem_() {
      this.dispatchEvent(new CustomEvent('item-activate', { bubbles: true, composed: true}));
    }

    renderItems_(keywordsModel, searchString) {
      this.highlightedResultIdx = -1;

      var items = [];

      if (keywordsModel) {
        var matches = keywordsModel.getMatches(searchString.toLowerCase());
        matches.forEach(function(keywordMatch) {
          //
          keywordMatch.pageReferences.forEach(function(ref) {
            var itemModel = Object.create(ref);
            // Augment the raw page reference with the matched keyword and
            // and match type as labels.
            itemModel.typeLabel = this.TypeLabel[ref.type];
            itemModel.label = keywordMatch.keyword;
            itemModel.icon = this.TypeIcon[ref.type];

            itemModel.domainHref = SITE_ROOT + ref.domainHref;
            // Concatenate the base domain path with the anchor ref if defined,
            // otherwise assign the domain path to it.
            itemModel.href = ref.href ?
                itemModel.domainHref + ref.href : itemModel.domainHref;
            items.push(itemModel);
          }, this);
        }, this);
      }

      this._debouncer = Polymer.Debouncer.debounce(this._debouncer,
        Polymer.Async.timeOut.after(50),
        () => {
          this._setRenderItems(items);
        });
    }

    handleRenderItemsChange_() {
      this.empty_ = !this.renderItems.length;
    }

    computeMatchHref_(match) {
      if (this.isDomainType_(match.type)) {
        return match.domainHref;
      }
      return match.href;
    }

    isDomainType_(type) {
      return type === this.Type.DOMAIN;
    }

    get Type() {
      return {
        DOMAIN: '0',
        EVENT: '1',
        PARAM: '2',
        TYPE: '3',
        METHOD: '4'
      };
    }

    get TypeLabel() {
      return {
        '0': 'Domain',
        '1': 'Event',
        '2': 'Parameter',
        '3': 'Type',
        '4': 'Method'
      }
    }

    get TypeIcon() {
      return {
        '0': '',
        '1': 'image:wb-iridescent',
        '2': 'icons:more-horiz',
        '3': 'icons:code',
        '4': 'icons:apps'
      };
    }
  };

  customElements.define('cr-search-menu', CRSearchMenu);
})();
