// Read-only report. Credentials remain local; no messages or listing changes are made.
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
for (const file of ['.env.local', '.env.development', '.env']) {
  if (fs.existsSync(file)) dotenv.config({ path: file, override: false });
}
const { buildReport, fetchAll } = require('../server/api-util/provider-follow-up');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
(async () => {
  let users, listings;
  if (process.argv[3] && process.argv[4]) {
    ({ users, listings } = require('../server/api-util/provider-csv').fromExports(fs.readFileSync(process.argv[3], 'utf8'), fs.readFileSync(process.argv[4], 'utf8')));
  } else {
    const clientId = process.env.REACT_APP_SHARETRIBE_INTEGRATION_SDK_CLIENT_ID;
    const clientSecret = process.env.SHARETRIBE_INTEGRATION_SDK_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error('Provide Users and Listings CSV export paths after the output folder, or configure Sharetribe Integration credentials.');
    const sdk = require('sharetribe-flex-integration-sdk').createInstance({ clientId, clientSecret });
    users = await fetchAll(params => sdk.users.query(params), {});
    listings = await fetchAll(params => sdk.listings.query(params), { states: ['published'], include: ['author'] });
  }
  const report = buildReport(users, listings);
  const folder = path.resolve(process.argv[2] || 'outputs/provider-follow-up');
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'report.json'), JSON.stringify(report, null, 2));
  const table = (title, rows, columns) => '<h2>' + title + '</h2><div class="scroll"><table><thead><tr>' + columns.map(([key, label]) => '<th>' + label + '</th>').join('') + '</tr></thead><tbody>' + rows.map(row => '<tr data-status="' + row.status + '">' + columns.map(([key]) => '<td>' + escape(row[key]) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  const csv = (rows, columns) => [columns, ...rows.map(row => columns.map(key => row[key]))].map(row => row.map(v => '"' + String(v ?? '').replace(/^[=+@-]/, match => "'" + match).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  fs.writeFileSync(path.join(folder, 'providers.csv'), csv(report.providers, ['providerId', 'provider', 'email', 'publishedListings', 'status', 'lastRecordedAt', 'followUpOn', 'listingsDue', 'listingsUnknown']));
  fs.writeFileSync(path.join(folder, 'listings.csv'), csv(report.listings, ['listingId', 'title', 'providerId', 'provider', 'status', 'lastRecordedAt', 'followUpOn']));
  const html = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bali Listings — Follow-up report</title><style>body{font:16px system-ui;margin:32px;color:#29242b;background:#fcf8fd}h1{color:#742875}p{max-width:900px;line-height:1.6}input,select{padding:12px;margin:8px 12px 16px 0;font:inherit;max-width:100%;box-sizing:border-box}.scroll{overflow:auto}table{border-collapse:collapse;background:white;width:100%}th,td{padding:12px;text-align:left;border-bottom:1px solid #eee;vertical-align:top;font-size:14px}th{background:#f1e3f3}tr[data-status="Follow up"]{background:#fff0d8}tr[hidden]{display:none}</style><h1>Provider & listing follow-up</h1><p>Generated ' + escape(report.generatedAt) + '. Dates are UTC. ' + report.providers.length + ' providers with ' + report.listings.length + ' published listings.</p><p><b>Follow up:</b> 60 days or more since the recorded date. <b>Unknown:</b> no reliable activity or availability confirmation yet; review separately. Provider activity is recorded at most once per 24 hours during a visible signed-in visit or interaction. A recent visit does not confirm availability. This report never sends messages or removes listings.</p><label>Find provider or listing <input id="search" type="search"></label><label>Status <select id="status"><option value="">All</option><option>Follow up</option><option>Unknown</option><option>Current</option></select></label>' + table('Providers — last activity', report.providers, [['provider','Provider'],['email','Email'],['publishedListings','Published listings'],['status','Activity status'],['lastRecordedAt','Last activity'],['followUpOn','Follow up on'],['listingsDue','Listings overdue'],['listingsUnknown','Listings unconfirmed']]) + table('Listings — availability confirmation', report.listings, [['title','Listing'],['provider','Provider'],['status','Availability status'],['lastRecordedAt','Last confirmed'],['followUpOn','Follow up on'],['listingId','Listing ID']]) + '<script>const search=document.getElementById("search"),status=document.getElementById("status");function filter(){document.querySelectorAll("tbody tr").forEach(row=>{row.hidden=!!((status.value && row.dataset.status!==status.value)||!row.textContent.toLowerCase().includes(search.value.toLowerCase()))})}search.addEventListener("input",filter);status.addEventListener("change",filter);</script></html>';
  fs.writeFileSync(path.join(folder, 'report.html'), html);
  console.log(JSON.stringify({ folder, generatedAt: report.generatedAt, providers: report.providers.length, listings: report.listings.length, activityUnknown: report.providers.filter(x=>x.status==='Unknown').length, availabilityUnknown: report.listings.filter(x=>x.status==='Unknown').length }));
})().catch(error => { console.error('Report failed:', error.status || error.message); process.exitCode = 1; });
