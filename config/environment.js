/* jshint node: true */

module.exports = function(environment) {
    var ENV = {
        modulePrefix: 'ember-share',
        environment: environment,
        baseURL: '/',
        creativeworkName: 'Not Categorized',
        locationType: 'auto',
        EmberENV: {
            EXTEND_PROTOTYPES: {
                Date: false,
                Array: true,
                String: true,
                Function: true,
            },
            FEATURES: {
                // Here you can enable experimental features on an ember canary build
                // e.g. 'with-controller': true
            }
        },

        APP: {  // jscs:ignore
            // Here you can pass flags/options to your application instance
            // when it is created
        },

        contentSecurityPolicy: {
            'default-src': "'none'",
            'script-src': "'self' www.google-analytics.com",
            'font-src': "'self'",
            'connect-src': "'self' www.google-analytics.com",
            'img-src': "'self'",
            'style-src': "'self'",
            'media-src': "'self'"
        },

        modelIDs: {
            creativework: 49,
            publication: 49,
            preprint: 49,
            project: 49,
            registration: 49,
            dataset: 49,
            person: 47
        }

    };
    //this needs to go in an actual env at some point
    ENV.csrfCookie = 'csrftoken';
    ENV.apiBaseUrl = 'https://share.osf.io';
    ENV.apiUrl = 'https://share.osf.io/api/v2';
    ENV.curationEnabled = true;

    if (environment === 'production') {
    ENV.locationType = 'hash';
    ENV.baseUrl = '/ember-share/';
        ENV.apiBaseUrl = 'https://share.osf.io';
        ENV.apiUrl = 'https://share.osf.io/api/v2';
        ENV.curationEnabled = false;

        ENV.modelIDs = {
            person: 100,
            creativework: 70,
        };

        // Testem prefers this...
        ENV.baseURL = '/';

        // keep test console output quieter
        ENV.APP.LOG_ACTIVE_GENERATION = false;
        ENV.APP.LOG_VIEW_LOOKUPS = false;
    }

    return ENV;
};
