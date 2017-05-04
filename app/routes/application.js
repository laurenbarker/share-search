import Ember from 'ember';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';
import RouteHistoryMixin from 'ember-route-history/mixins/routes/route-history';

export default Ember.Route.extend(ApplicationRouteMixin, RouteHistoryMixin, {
    session: Ember.inject.service(),
});
