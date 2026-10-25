// Parse Sharetribe CSV exports, including quoted multiline JSON fields.
const parseCSV = text => {
  const rows = []; let row = [], cell = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (quoted) throw new Error('Incomplete CSV: unclosed quote');
  if (row.length || cell) { row.push(cell); rows.push(row); }
  const headers = rows.shift();
  if (!headers?.includes('Id') || !headers.includes('PrivateData')) throw new Error('Expected a Sharetribe CSV export with Id and PrivateData');
  return rows.filter(r=>r.some(Boolean)).map(values => {
    if (values.length !== headers.length) throw new Error('Incomplete CSV row');
    return Object.fromEntries(headers.map((key, i)=>[key,values[i]]));
  });
};
const fromExports = (userText, listingText) => ({
 users: parseCSV(userText).map(u=>({id:u.Id,attributes:{email:u.EmailAddress,profile:{displayName:u.DisplayName,firstName:u.FirstName,lastName:u.LastName,privateData:JSON.parse(u.PrivateData || '{}')}}})),
 listings: parseCSV(listingText).map(l=>({id:l.Id,attributes:{state:l.State,title:l.Title,privateData:JSON.parse(l.PrivateData || '{}')},relationships:{author:{data:{id:l.AuthorId}}}})),
});
module.exports = { parseCSV, fromExports };
