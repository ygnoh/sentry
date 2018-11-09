/*global global*/
import React from 'react';
import {browserHistory} from 'react-router';

import {Client} from 'app/api';
import {mount} from 'enzyme';
import OrganizationDeveloperSettings from 'app/views/settings/organizationDeveloperSettings/index';

describe('Organization Developer Settings', function() {
  let org = TestStubs.Organization();
  let sentryApp = TestStubs.SentryApp();
  let install = TestStubs.SentryAppInstallation({
    organization: {slug: org.slug},
    code: '50624ecb-7aac-49d6-934a-83e53677560f',
  });

  let routerContext = TestStubs.routerContext();

  beforeEach(() => {
    Client.clearMockResponses();
  });

  describe('when no Apps exist', () => {
    Client.addMockResponse({
      url: `/organizations/${org.slug}/sentry-apps/`,
      body: [],
    });

    const wrapper = mount(
      <OrganizationDeveloperSettings params={{orgId: org.slug}} />,
      routerContext
    );

    it('displays empty state', () => {
      expect(wrapper).toMatchSnapshot();
      expect(wrapper.exists('EmptyMessage')).toBe(true);
    });
  });

  describe('when Apps exist', () => {
    Client.addMockResponse({
      url: `/organizations/${org.slug}/sentry-apps/`,
      body: [sentryApp],
    });

    let wrapper = mount(
      <OrganizationDeveloperSettings params={{orgId: org.slug}} />,
      routerContext
    );

    it('displays all Apps owned by the Org', () => {
      expect(wrapper).toMatchSnapshot();
      expect(wrapper.find('SentryApplicationRow').prop('app').name).toBe('Sample App');
    });

    describe('when installing', () => {
      beforeEach(() => {
        Client.addMockResponse({
          url: `/organizations/${org.slug}/sentry-app-installations/`,
          method: 'POST',
          body: install,
        });
      });

      it('redirects the user to the Integrations page when a redirectUrl is not set', () => {
        Client.addMockResponse({
          url: `/organizations/${org.slug}/sentry-apps/`,
          body: [TestStubs.SentryApp({redirectUrl: null})],
        });

        wrapper = mount(
          <OrganizationDeveloperSettings params={{orgId: org.slug}} />,
          routerContext
        );

        wrapper.find('StyledInstallButton').simulate('click');
        expect(browserHistory.push).toHaveBeenCalledWith(
          `/settings/${org.slug}/integrations/`
        );
      });

      it('redirects the user to the App when a redirectUrl is set', () => {
        Client.addMockResponse({
          url: `/organizations/${org.slug}/sentry-apps/`,
          body: [sentryApp],
        });

        wrapper = mount(
          <OrganizationDeveloperSettings params={{orgId: org.slug}} />,
          routerContext
        );

        wrapper.find('StyledInstallButton').simulate('click');

        expect(browserHistory.push).toHaveBeenCalledWith(
          `${sentryApp.redirectUrl}?code=${install.code}&installationId=${install.uuid}`
        );
      });

      it('handles a redirectUrl with pre-existing query params', () => {
        const sentryAppWithQuery = TestStubs.SentryApp({
          redirectUrl: 'https://example.com/setup?hello=1',
        });

        Client.addMockResponse({
          url: `/organizations/${org.slug}/sentry-apps/`,
          body: [sentryAppWithQuery],
        });

        wrapper = mount(
          <OrganizationDeveloperSettings params={{orgId: org.slug}} />,
          routerContext
        );

        wrapper.find('StyledInstallButton').simulate('click');

        expect(browserHistory.push).toHaveBeenCalledWith(
          `https://example.com/setup?code=${install.code}&hello=1&installationId=${install.uuid}`
        );
      });
    });
  });
});
