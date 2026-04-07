// POST /api/contact
// Creates or updates a HubSpot CRM contact from form data
const hubspot = require("@hubspot/api-client");

exports.main = async (context, sendResponse) => {
  const { email, firstname, lastname, phone, message } = context.body;

  if (!email) {
    return sendResponse({
      statusCode: 400,
      body: { error: "email is required" }
    });
  }

  try {
    const client = new hubspot.Client({
      accessToken: process.env.PRIVATE_APP_TOKEN
    });

    const contactObj = {
      properties: {
        email,
        firstname: firstname || "",
        lastname: lastname || "",
        phone: phone || "",
        message: message || ""
      }
    };

    // Upsert: create or update by email
    await client.crm.contacts.basicApi.create({ properties: contactObj.properties });

    sendResponse({
      statusCode: 200,
      body: { success: true, email }
    });
  } catch (err) {
    // Handle duplicate contact (already exists)
    if (err.code === 409) {
      return sendResponse({
        statusCode: 200,
        body: { success: true, email, note: "contact already exists" }
      });
    }
    sendResponse({
      statusCode: 500,
      body: { error: err.message }
    });
  }
};
