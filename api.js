const loginRoute = `https://${Config.baseUrl}/api/login.json`;
const logoutRoute = `https://${Config.baseUrl}/api/logout.json`;
const contactsRoute = `https://${Config.baseUrl}/api/v1/whatsapp_contacts`;
const meRoute = `https://${Config.baseUrl}/api/v1/client_users/me.json`;

export async function login(email, password) {
  return await fetch(loginRoute, {
    method: "POST",
    body: JSON.stringify({
      api_user: {
        email: email,
        password: password
      }
    }),
    headers: {
      "Content-type": "application/json",
      "Accept": "application/json"
    }
  })
}

export async function logout(apiToken) {
  return await fetch(logoutRoute, {
    method: "DELETE",
    headers: {
      "Content-type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiToken}`
    }
  })
};

export async function fetchClientUserId(apiToken) {
  return await fetch(meRoute, {
    method: "GET",
    headers: {
      "Content-type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiToken}`
    }
  })
};

export async function fetchComponents(apiToken, clientUserId) {
  return await fetch(componentsRouteFor(clientUserId), {
    method: "GET",
    headers: {
      "Content-type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiToken}`
    }
  })
};

export async function fetchContactByExternalId(apiToken, externalId) {
  return await fetch(`${contactsRoute}?external_id=${externalId}`, {
    method: "GET",
    headers: {
      "Content-type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiToken}`
    }
  })
};

export async function fetchComponentMappingFor(apiToken, componentId) {
  return await fetch(componentMappingRouteFor(componentId), {
    method: "GET",
    headers: {
      "Content-type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiToken}`
    }
  })
};

export async function createContactByExternalId(apiToken, externalId, componentId, data, parentComponentId = null) {
  return await fetch(`${createContactRouteFor(componentId)}`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiToken}`
    },
    body: JSON.stringify({
      ...(parentComponentId && { "parent_component_id": parentComponentId }),
      "whatsapp_contact": {
        "data": data,
        "external_id": externalId
      },
    })
  })
};

function componentsRouteFor(clientUserId) {
  return `https://${Config.baseUrl}/api/v1/client_users/${clientUserId}/components?filter=mappable_to_whatsapp_contact.json`
}

function createContactRouteFor(componentId) {
  return `https://${Config.baseUrl}/api/v1/components/${componentId}/whatsapp_contacts`
}

function componentMappingRouteFor(componentId) {
  return `https://${Config.baseUrl}/api/v1/components/${componentId}/whatsapp_web_mappings.json`
}
