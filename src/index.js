import { gridAwarePower } from '@greenweb/grid-aware-websites';
import { getLocation, saveDataToKv, fetchDataFromKv } from '@greenweb/gaw-plugin-cloudflare-workers';

export default {
	// First fetch the request
	async fetch(request, env, ctx) {
		const response = await fetch(request.url);
		// Then check if the request content type is HTML.
		const contentType = response.headers.get('content-type');

		// If the content is not HTML, then return the response without any changes.
		if (!contentType || !contentType.includes('text/html')) {
			return new Response(response.body, {
				...response,
			});
		}

		try {
			// If the content type is HTML, we get the country the request came from
			const location = await getLocation(request);
			const { country } = location;

			// If the country data does not exist, then return the response without any changes.
			if (!country) {
				return new Response(response.body, {
					...response,
				});
			}

			// First check if the there's data for the country saved to KV
			let gridData = await fetchDataFromKv(env, country);

			// If no cached data, fetch it using the `gridAwarePower` function
			if (!gridData) {
				gridData = await gridAwarePower(country, env.EMAPS_API_KEY, {
					mode: 'low-carbon',
				});
			}

			// If there's an error getting data, return the web page without any modifications
			if (gridData.status === 'error') {
				return new Response(response.body, {
					...response,
					headers: {
						...response.headers,
					},
				});
			}

			// Save the gridData to the KV store. By default, data is cached for 1 hour.
			await saveDataToKv(env, country, JSON.stringify(gridData));

			// If the grid aware flag is triggered (gridAware === true), then we'll return a modified HTML page to the user.
			if (gridData.gridAware) {
				const modifyHTML = new HTMLRewriter().on('iframe', {
					element(element) {
						element.remove();
					},
				});

				// Transform the response using the HTMLRewriter API, and set appropriate headers.
				let modifiedResponse = new Response(modifyHTML.transform(response).body, {
					...response,
					headers: {
						...response.headers,
						'Content-Type': 'text/html;charset=UTF-8',
					},
				});

				return modifiedResponse;
			}

			return new Response(response.body, {
				...response,
				headers: {
					...response.headers,
				},
			});
		} catch (e) {
			return new Response(response.body, {
				...response,
				headers: {
					...response.headers,
				},
			});
		}
	},
};
