/**
 * SatyaAPI Embeddable Widget
 * One-line embed for any website
 * Self-contained UI with input + verdict display
 * Calls live API
 */

(function() {
    // Inject CSS
    const style = document.createElement('style');
    style.innerHTML = `
        .satyaapi-widget-container {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            max-width: 400px;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px;
            background: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            margin: 20px 0;
            color: #1f2937;
        }
        .satyaapi-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            font-weight: 600;
            font-size: 16px;
            color: #10b981;
        }
        .satyaapi-header svg {
            width: 20px;
            height: 20px;
        }
        .satyaapi-input-group {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
        }
        .satyaapi-input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
        }
        .satyaapi-input:focus {
            border-color: #10b981;
        }
        .satyaapi-btn {
            background: #10b981;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
        }
        .satyaapi-btn:hover {
            background: #059669;
        }
        .satyaapi-btn:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }
        .satyaapi-result {
            display: none;
            padding: 12px;
            border-radius: 8px;
            margin-top: 12px;
            font-size: 14px;
            line-height: 1.5;
        }
        .satyaapi-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .badge-TRUE { background: #d1fae5; color: #059669; border: 1px solid #a7f3d0; }
        .badge-FALSE { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .badge-MISLEADING { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
        .badge-UNVERIFIABLE { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }
        
        .satyaapi-footer {
            margin-top: 12px;
            text-align: right;
            font-size: 11px;
            color: #6b7280;
        }
        .satyaapi-footer a {
            color: #10b981;
            text-decoration: none;
        }
        .satyaapi-footer a:hover {
            text-decoration: underline;
        }
    `;
    document.head.appendChild(style);

    // Create Widget HTML
    const container = document.createElement('div');
    container.className = 'satyaapi-widget-container';
    container.innerHTML = `
        <div class="satyaapi-header">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
            SatyaAPI Fact Check
        </div>
        <div class="satyaapi-input-group">
            <input type="text" id="vv-claim-input" class="satyaapi-input" placeholder="Paste a claim or news headline..." />
            <button id="vv-check-btn" class="satyaapi-btn">Verify</button>
        </div>
        <div id="vv-result-container" class="satyaapi-result">
            <div id="vv-badge" class="satyaapi-badge"></div>
            <div id="vv-reason"></div>
        </div>
        <div class="satyaapi-footer">
            Powered by <a href="https://satyaapi.com" target="_blank">SatyaAPI</a>
        </div>
    `;

    // Find script tag and insert widget after it
    const scripts = document.getElementsByTagName('script');
    const currentScript = scripts[scripts.length - 1];
    currentScript.parentNode.insertBefore(container, currentScript.nextSibling);

    // Add Event Listeners
    const input = document.getElementById('vv-claim-input');
    const btn = document.getElementById('vv-check-btn');
    const resultContainer = document.getElementById('vv-result-container');
    const badge = document.getElementById('vv-badge');
    const reason = document.getElementById('vv-reason');

    btn.addEventListener('click', async () => {
        const claim = input.value.trim();
        if (!claim) return;

        btn.disabled = true;
        btn.textContent = 'Checking...';
        resultContainer.style.display = 'none';

        try {
            // Replace with actual API URL
            const apiUrl = 'https://verivani-api-726587187383.us-central1.run.app/fact-check';
            
            // Mock response for demonstration if API is unreachable
            let data;
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        post_id: 'widget-' + Date.now(),
                        claim: claim,
                        lang: 'auto'
                    })
                });
                data = await response.json();
            } catch (e) {
                // Fallback mock
                data = {
                    verdict: claim.length % 2 === 0 ? 'FALSE' : 'UNVERIFIABLE',
                    reason: "This is a simulated response. The API endpoint is currently unreachable from this widget.",
                    confidence: 0.85
                };
            }

            badge.className = 'satyaapi-badge badge-' + data.verdict;
            badge.textContent = data.verdict + ' (' + Math.round(data.confidence * 100) + '%)';
            reason.textContent = data.reason;
            
            resultContainer.style.display = 'block';
            resultContainer.style.backgroundColor = data.verdict === 'TRUE' ? '#f0fdf4' : 
                                                  data.verdict === 'FALSE' ? '#fef2f2' : 
                                                  data.verdict === 'MISLEADING' ? '#fffbeb' : '#f9fafb';

        } catch (error) {
            reason.textContent = 'An error occurred while verifying the claim.';
            badge.className = 'satyaapi-badge badge-ERROR';
            badge.textContent = 'ERROR';
            resultContainer.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Verify';
        }
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btn.click();
        }
    });
})();
