/**
 * Welcome to Cloudflare Workers! This is your first Workflows application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Workflow in action
 * - Run `npm run deploy` to publish your application
 *
 * Learn more at https://developers.cloudflare.com/workflows
 */
 
/**
 * @typedef {Object} Env
 * @property {Workflow} MY_WORKFLOW
 **/

async function createAirtableRecord(env, body) {
	try {
		const result = await fetch(
			`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(env.AIRTABLE_TABLE_NAME)}`,
			{
				method: "POST",
				body: JSON.stringify(body),
				headers: {
					Authorization: `Bearer ${env.cloudflare}`,
					"Content-Type": `application/json`,
				},
			},
		);
		return result;
	} catch (error) {
		console.error(error);
		throw error;
	}
}

async function submitHandler(request, env) {
	if (request.method !== "POST") {
		return new Response("Method Not Allowed", { status: 405 });
	}
	const body = await request.formData();
	const { first_name, 
		    last_name, 
			email, 
			phone, 
			subject, 
			message } =
		Object.fromEntries(body);

	// The keys in "fields" are case-sensitive, and
	// should exactly match the field names you set up
	// in your Airtable table, such as "First Name".
	const reqBody = {
		fields: {
			"First Name": first_name,
			"Last Name": last_name,
			Email: email,
			"Phone Number": phone,
			Subject: subject,
			Message: message,
		},
	};
	const result = await createAirtableRecord(env, reqBody);
  	if (result && result.ok) {
    	return new Response("Success,message sent", { status: 200 });
		return Response.redirect(new URL("/", request.url), 302);
  	}
	const errorText = await result.text();
	console.error("Airtable API error:", result.status, errorText);
	return new Response(`Error creating record: ${result.status} ${errorText}`, { status: 500 });

  	//return new Response("Error creating record", { status: 500 });
	//await createAirtableRecord(env, reqBody);
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.pathname === "/submit") {
			return await submitHandler(request, env);
		}
		return new Response("Not found", { status: 404 });
	},
}
