// api/chat.js
async function retry(fn, retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            // Parse error message if it's a string
            let errorObj = error;
            if (typeof error.message === 'string') {
                try {
                    errorObj = JSON.parse(error.message);
                } catch (e) {
                    // Keep original error if parsing fails
                }
            }

            // Check for overloaded error in parsed object
            const isOverloaded = errorObj?.error?.type === 'overloaded_error' ||
                               errorObj?.type === 'error' && errorObj?.error?.type === 'overloaded_error';

            if (i === retries - 1) throw error;
            if (isOverloaded) {
                console.log(`Retry attempt ${i + 1} of ${retries}. Waiting ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                continue;
            }
            throw error;
        }
    }
}

export default async function handler(req, res) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { message, systemPrompt } = req.body;
        
        console.log('API Key present:', !!process.env.ANTHROPIC_API_KEY);

        const response = await retry(async () => {
            const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01',
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-beta': 'messages-2023-12-15'
                },
                body: JSON.stringify({
                    model: 'claude-3-opus-20240229',
                    messages: [{
                        role: 'user',
                        content: message
                    }],
                    system: systemPrompt,
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse.text();
                console.log('API Response not OK:', apiResponse.status, errorData);
                
                try {
                    const parsedError = JSON.parse(errorData);
                    throw new Error(JSON.stringify(parsedError));
                } catch (e) {
                    throw new Error(errorData);
                }
            }

            return apiResponse.json();
        });

        res.status(200).json(response);
    } catch (error) {
        console.error('Server error:', error);
        
        // Try to parse error message if it's a string
        let errorResponse = { error: error.message };
        try {
            const parsedError = JSON.parse(error.message);
            errorResponse = {
                error: parsedError.error.message || 'Unknown error',
                type: parsedError.error.type || 'unknown_error'
            };
        } catch (e) {
            // Keep original error if parsing fails
        }

        res.status(500).json(errorResponse);
    }
}
