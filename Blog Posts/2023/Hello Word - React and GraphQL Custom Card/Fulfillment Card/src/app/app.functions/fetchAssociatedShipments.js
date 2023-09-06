const axios = require('axios');

exports.main = async (context = {}, sendResponse) => {
  // const's are set by parameters that were passed in and from our secrets
  const { hs_object_id } = context.parameters;
  const PRIVATE_APP_TOKEN = context.secrets.PRIVATE_APP_ACCESS_TOKEN;

  try {
    // Fetch associated shipments and assign to a const
    const { data } = await fetchAssociatedShipments(
      query,
      PRIVATE_APP_TOKEN,
      hs_object_id
    );

    // Send the response data
    sendResponse(data);
  } catch (e) {
    sendResponse(e);
  }
};

const fetchAssociatedShipments = (query, token, hs_object_id) => {
  // Set our body for the axios call
  const body = {
    operationName: 'shipmentData',
    query,
    variables: { hs_object_id }
  };
  // return the axios post
  return axios.post(
    'https://api.hubapi.com/collector/graphql',
    JSON.stringify(body),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// GraphQL query to fetch shipment associations and nested kit associations from HubSpot
const query = `
query shipmentData($hs_object_id: String!) {
  CRM {
    company(uniqueIdentifier: "hs_object_id", uniqueIdentifierValue: $hs_object_id) {
      associations {
        p_shipments_collection__shipments_to_company {
          items {
            hs_object_id
            year
            order_num
            description
            status
            carrier
            tracking_num
            associations {
              p_kits_collection__shipments_to_kits {
                items {
                  year
                  kit_number
                  status
                  hold_reason
                }
              }
            }
          }
        }
      }
    }
  }
}
`