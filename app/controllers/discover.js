import _ from 'lodash/lodash';
import Ember from 'ember';
import ApplicationController from './application';
import buildElasticCall from '../utils/build-elastic-call';

export default ApplicationController.extend({
    queryParams: ['page', 'searchString'],
    page: 1,
    size: 10,
    query: {},
    searchString: '',
    displayQueryBaseString: Ember.computed( function() {
        return buildElasticCall(Ember.$.param(this.searchQuery()));
    }),
    collapsedQueryBody: true,

    results: Ember.ArrayProxy.create({content: []}),
    loading: true,

    init() {
        //TODO Sort initial results on date_modified
        this._super(...arguments);
        this.set('facetFilters', Ember.Object.create());

        let query = this.searchQuery();
        // TODO Load all previous pages when hitting a page with page > 1
        // if (this.get('page') != 1) {
        //   query.from = 0;
        //   query.size = this.get('page') * this.get('size');
        // }
        this.loadPage(query);
        this.set('debouncedLoadPage', _.debounce(this.loadPage.bind(this), 250));
    },

    searchQuery() {
        let query = {
            q: this.get('searchString') || '*',  // Default to everything
            from: (this.get('page') - 1) * this.get('size')
        };
        return query;
    },

    getQueryBody() {
        let facetFilters = this.get('facetFilters');
        let filters = [];
        for (let k of Object.keys(facetFilters)) {
            let filter = facetFilters[k];
            if (filter) {
                if (Ember.$.isArray(filter)) {
                    filters = filters.concat(filter);
                } else {
                    filters.push(filter);
                }
            }
        }

        let queryBody = {
            'query': {
                'bool': {
                    'must': {
                        'query_string' : {
                            'query': this.get('searchString') || '*'
                        },
                    },
                    'filter': filters
                }
            },
            'aggregations': this.get('elasticAggregations')
        };
        return this.set('queryBody', queryBody);
    },

    elasticAggregations: Ember.computed(function() {
        return {
            "providers" : {
                "terms" : { "field" : "sources" }
            },
            "types" : {
                "terms" : { "field" : "@type" }
            },
        };
    }),

    loadPage(query=null) {
        query = query || this.searchQuery();
        let queryString = Ember.$.param(query);
        let queryBody = JSON.stringify(this.getQueryBody());
        const url = buildElasticCall(queryString);
        this.set('loading', true);
        return Ember.$.ajax({
            'url': url,
            'crossDomain': true,
            'type': 'POST',
            'contentType': 'application/json',
            'data': queryBody
        }).then((json) => {
            let results = json.hits.hits.map((hit) => {
                // HACK
                let source = hit._source;
                source.id = hit._id;
                source.type = 'elastic-search-result';
                source.workType = source['@type'];
                source.contributors = source.contributors.map(contributor => {
                    return {
                        familyName: contributor.family_name,
                        givenName: contributor.given_name,
                        id: contributor['@id']
                    };
                });
                return source;
            });
            Ember.run(() => {
                this.set('aggregations', json.aggregations);
                this.set('loading', false);
                this.get('results').addObjects(results);
            });
        });
    },

    search() {
        this.set('page', 1);
        this.set('loading', true);
        this.get('results').clear();
        this.get('debouncedLoadPage')();
    },

    facets: Ember.computed(function() {
        return [
            { key: 'date', title: 'Date', component: 'search-facet-daterange' },
            { key: 'type', title: 'Type', component: 'search-facet-worktype' },
            { key: 'tags', title: 'Subject/Tag', component: 'search-facet-typeahead', type: 'tag' },
            { key: 'publisher', title: 'Publisher', queryKey: 'associations', useId: 'true', component: 'search-facet-typeahead' },
            { key: 'funder', title: 'Funder', queryKey: 'associations', useId: 'true', component: 'search-facet-typeahead' },
            { key: 'institution', title: 'Institution', queryKey: 'associations', useId: 'true', component: 'search-facet-typeahead' },
            { key: 'organization', title: 'Organization', queryKey: 'associations', useId: 'true', component: 'search-facet-typeahead' },
            { key: 'language', title: 'Language', component: 'search-facet-language' },
            { key: 'contributor', title: 'People', type: 'person', useId: true, component: 'search-facet-typeahead' },
            { key: 'source', title: 'Source', component: 'search-facet-source' }
        ];
    }),

    actions: {
        toggleCollapsedQueryBody() {
            this.toggleProperty('collapsedQueryBody');
        },
        typing(val, event) {
            // Ignore all keycodes that do not result in the value changing
            // 8 == Backspace, 32 == Space
            if (event.keyCode < 49 && !(event.keyCode === 8 || event.keyCode === 32)) {
                return;
            }
            this.search();
        },
        search() {
            this.search();
        },
        filtersChanged(facetFilters) {
            this.set('facetFilters', facetFilters);
            this.search();
        },
        next() {
            // If we don't have full pages then we've hit the end of our search
            if (this.get('results.length') % this.get('size') !== 0) {
                return;
            }
            this.incrementProperty('page', 1);
            this.loadPage();
        },
        prev() {
            // No negative pages
            if (this.get('page') < 1) {
                return;
            }
            this.decrementProperty('page', 1);
            this.loadPage();
        },
        clickGraph(key, id) {
        }
    }
});
