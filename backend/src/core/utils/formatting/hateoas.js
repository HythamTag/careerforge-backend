/**
 * HATEOAS (Hypermedia as the Engine of Application State) Utility
 *
 * Generates consistent hypermedia links for API responses.
 */

const { JOB_STATUS } = require('@constants');

class Hateoas {
  /**
   * Generate links for a resource
   */
  static resourceLinks(resourceType, resourceId, actions = []) {
    const links = {};
    const basePath = this.getBasePath(resourceType);

    if (!basePath) { return links; }

    // Self link
    links.self = `${basePath}/${resourceId}`;

    // Standard CRUD actions
    if (actions.includes('read')) {
      links.self = `${basePath}/${resourceId}`;
    }

    if (actions.includes('update')) {
      links.update = {
        href: `${basePath}/${resourceId}`,
        method: 'PUT',
      };
    }

    if (actions.includes('delete')) {
      links.delete = {
        href: `${basePath}/${resourceId}`,
        method: 'DELETE',
      };
    }

    if (actions.includes('patch')) {
      links.patch = {
        href: `${basePath}/${resourceId}`,
        method: 'PATCH',
      };
    }

    return links;
  }

  /**
   * Generate links for a collection
   */
  static collectionLinks(resourceType, pagination = null, filters = {}) {
    const links = {};
    const basePath = this.getBasePath(resourceType);

    if (!basePath) { return links; }

    // Collection link
    links.self = basePath;

    // Create link
    links.create = {
      href: basePath,
      method: 'POST',
    };

    // Pagination links (if provided)
    if (pagination) {
      const queryParams = new URLSearchParams(filters);

      // Add limit if provided
      if (pagination.limit) {
        queryParams.set('limit', pagination.limit);
      }

      if (pagination.hasPrev) {
        queryParams.set('page', pagination.page - 1);
        links.prev = `${basePath}?${queryParams.toString()}`;
      }

      if (pagination.hasNext) {
        queryParams.set('page', pagination.page + 1);
        links.next = `${basePath}?${queryParams.toString()}`;
      }

      if (pagination.totalPages > 1) {
        queryParams.set('page', 1);
        links.first = `${basePath}?${queryParams.toString()}`;

        queryParams.set('page', pagination.totalPages);
        links.last = `${basePath}?${queryParams.toString()}`;
      }
    }

    return links;
  }

  /**
   * Generate links for job-related resources
   */
  static jobLinks(jobId, jobType, status) {
    const links = {};
    const basePath = '/v1/jobs';

    links.self = `${basePath}/${jobId}`;

    // Status-specific links
    if ([JOB_STATUS.PENDING, JOB_STATUS.PROCESSING].includes(status)) {
      links.cancel = {
        href: `${basePath}/${jobId}/cancel`,
        method: 'POST',
        title: 'Cancel job',
      };
    }

    if (status === JOB_STATUS.COMPLETED) {
      links.result = `${basePath}/${jobId}/result`;

      // Type-specific result links
      switch (jobType) {
        case 'generation':
          links.download = `/v1/pdf-generations/${jobId}/download`;
          break;
        case 'enhancement':
          links.result = `/v1/optimization-jobs/${jobId}/result`;
          break;
        case 'ats_analysis':
          links.result = `/v1/ats-analyses/${jobId}/result`;
          break;
      }
    }

    return links;
  }

  /**
   * Generate links for user-related resources
   */
  static userLinks(userId, context = 'profile') {
    const links = {};

    switch (context) {
      case 'profile':
        links.self = '/v1/users/me';
        links.update = {
          href: '/v1/users/me',
          method: 'PUT',
        };
        links.changePassword = {
          href: '/v1/users/me/password',
          method: 'PUT',
        };
        links.avatar = '/v1/users/me/avatar';
        links.subscription = '/v1/users/me/subscription';
        links.stats = '/v1/users/me/stats';
        break;

      case 'admin':
        links.self = `/v1/users/${userId}`;
        links.update = {
          href: `/v1/users/${userId}`,
          method: 'PUT',
        };
        links.delete = {
          href: `/v1/users/${userId}`,
          method: 'DELETE',
        };
        links.suspend = {
          href: `/v1/users/${userId}/suspend`,
          method: 'POST',
        };
        break;
    }

    return links;
  }

  /**
   * Generate links for CV-related resources
   */
  static cvLinks(cvId, actions = []) {
    const links = {};
    const basePath = '/v1/cvs';

    links.self = `${basePath}/${cvId}`;

    if (actions.includes('update')) {
      links.update = {
        href: `${basePath}/${cvId}`,
        method: 'PUT',
      };
    }

    if (actions.includes('delete')) {
      links.delete = {
        href: `${basePath}/${cvId}`,
        method: 'DELETE',
      };
    }

    if (actions.includes('parse')) {
      links.parse = {
        href: `/v1/parsing-jobs`,
        method: 'POST',
        body: { cvId: cvId }
      };
    }

    if (actions.includes('versions')) {
      links.versions = `${basePath}/${cvId}/versions`;
    }

    if (actions.includes('upload')) {
      links.upload = `${basePath}/${cvId}/upload`;
    }

    return links;
  }

  /**
   * Generate links for webhook-related resources
   */
  static webhookLinks(webhookId, actions = []) {
    const links = {};
    const basePath = '/v1/webhooks';

    links.self = `${basePath}/${webhookId}`;

    if (actions.includes('update')) {
      links.update = {
        href: `${basePath}/${webhookId}`,
        method: 'PUT',
      };
    }

    if (actions.includes('delete')) {
      links.delete = {
        href: `${basePath}/${webhookId}`,
        method: 'DELETE',
      };
    }

    if (actions.includes('test')) {
      links.test = {
        href: `${basePath}/${webhookId}/test`,
        method: 'POST',
      };
    }

    if (actions.includes('deliveries')) {
      links.deliveries = `${basePath}/${webhookId}/deliveries`;
    }

    return links;
  }

  /**
   * Generate action links for specific operations
   */
  static actionLinks(resourceType, resourceId, actions) {
    const links = {};
    const basePath = this.getBasePath(resourceType);

    if (!basePath || !actions) { return links; }

    actions.forEach(action => {
      switch (action) {
        case 'analyze':
          links.analyze = {
            href: '/v1/ats-analyses',
            method: 'POST',
            title: 'Analyze ATS compatibility',
          };
          break;

        case 'enhance':
          links.enhance = {
            href: '/v1/optimization-jobs',
            method: 'POST',
            title: 'Enhance CV content',
          };
          break;

        case 'generate':
          links.generate = {
            href: '/v1/pdf-generations',
            method: 'POST',
            title: 'Generate CV',
          };
          break;

        case 'duplicate':
          links.duplicate = {
            href: `${basePath}/${resourceId}/duplicate`,
            method: 'POST',
            title: 'Create duplicate',
          };
          break;

        case 'export':
          links.export = `${basePath}/${resourceId}/export`;
          break;

        case 'share':
          links.share = {
            href: `${basePath}/${resourceId}/share`,
            method: 'POST',
            title: 'Share resource',
          };
          break;
      }
    });

    return links;
  }

  /**
   * Get base path for resource type
   */
  static getBasePath(resourceType) {
    const paths = {
      users: '/v1/users',
      cvs: '/v1/cvs',
      versions: '/v1/cvs/{cvId}/versions',
      jobs: '/v1/jobs',
      webhooks: '/v1/webhooks',
      templates: '/v1/templates',
      generation: '/v1/pdf-generations',
      enhancement: '/v1/optimization-jobs',
      ats: '/v1/ats-analyses',
      health: '/v1/health',
    };

    return paths[resourceType] || null;
  }

  /**
   * Generate relationship links
   */
  static relationshipLinks(resourceType, resourceId, relationships) {
    const links = {};

    relationships.forEach(rel => {
      switch (rel) {
        case 'author':
        case 'owner':
          links[rel] = `/v1/users/${resourceId}`;
          break;

        case 'versions':
          links[rel] = `/v1/cvs/${resourceId}/versions`;
          break;

        case 'jobs':
          links[rel] = `/v1/jobs?resourceId=${resourceId}`;
          break;

        case 'webhooks':
          links[rel] = `/v1/webhooks?userId=${resourceId}`;
          break;

        case 'resumes':
          links[rel] = `/v1/cvs?userId=${resourceId}`;
          break;
      }
    });

    return links;
  }

  /**
   * Generate navigation links for API discovery
   */
  static navigationLinks(currentResource = null) {
    const links = {
      home: '/v1/',
      health: '/v1/health',
      docs: '/api-docs',
    };

    // Add resource-specific navigation
    if (currentResource) {
      switch (currentResource) {
        case 'resumes':
          links.templates = '/v1/templates';
          links.generation = '/v1/pdf-generations';
          break;

        case 'generation':
          links.cvs = '/v1/cvs';
          links.templates = '/v1/templates';
          break;

        case 'webhooks':
          links.deliveries = '/v1/webhooks/stats';
          break;
      }
    }

    return links;
  }

  /**
   * Merge multiple link objects
   */
  static mergeLinks(...linkObjects) {
    return Object.assign({}, ...linkObjects);
  }

  /**
   * Filter links based on user permissions
   */
  static filterByPermissions(links, permissions) {
    const filtered = {};

    Object.entries(links).forEach(([key, value]) => {
      // Check if link requires specific permission
      if (value.permission && !permissions.includes(value.permission)) {
        return;
      }

      // Check method-specific permissions
      if (value.method && value.permission) {
        const requiredPermission = `${value.method.toLowerCase()}_${value.permission}`;
        if (!permissions.includes(requiredPermission)) {
          return;
        }
      }

      filtered[key] = value;
    });

    return filtered;
  }
}

module.exports = Hateoas;

