/* Admin dashboard. Uses only the Supabase publishable key from admin-config.js. */
const cfg = window.GILL_SUPABASE_CONFIG;
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);
const specs = {
  programs: [['title','Title'],['description','Description','textarea'],['level','Level'],['duration','Duration'],['fee','Fee','number'],['sort_order','Display order','number']],
  coaches: [['full_name','Full name'],['role','Role'],['qualification','Qualification'],['experience_years','Experience (years)','number'],['specialization','Specialization'],['biography','Biography','textarea'],['photo_url','Photo URL']],
  facilities: [['name','Name'],['description','Description','textarea'],['icon','Icon']],
  news: [['title','Title'],['summary','Summary','textarea'],['content','Full content','textarea'],['image_url','Image URL'],['event_date','Event date','date'],['sort_order','Display order','number']],
  testimonials: [['person_name','Name'],['relationship','Relationship'],['rating','Rating (1–5)','number'],['review','Review','textarea'],['photo_url','Photo URL'],['sort_order','Display order','number']],
  achievements: [['title','Title'],['description','Description','textarea'],['achievement_date','Achievement date','date'],['image_url','Image URL'],['sort_order','Display order','number']],
};
let client, currentResource = 'programs', editingId = null;
const toast = message => { const node = $('#toast'); node.textContent = message; node.classList.add('show'); setTimeout(() => node.classList.remove('show'), 3600); };
const escape = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

function boot() {
  if (!cfg?.url || !cfg?.publishableKey || cfg.url.includes('YOUR_PROJECT')) {
    $('#login-status').textContent = 'Add your Supabase URL and publishable key to admin-config.js first.';
    return;
  }
  client = window.supabase.createClient(cfg.url, cfg.publishableKey, { auth: { persistSession: true, autoRefreshToken: true } });
  client.auth.getSession().then(({ data }) => data.session && openApp());
}
async function openApp() {
  const { data, error } = await client.from('admin_users').select('user_id').limit(1);
  if (error || !data?.length) { await client.auth.signOut(); $('#login-status').textContent = 'This account is not an academy administrator.'; return; }
  $('#login-view').hidden = true; $('#app-view').hidden = false; showView('dashboard');
}
async function signIn(event) {
  event.preventDefault(); const form = new FormData(event.currentTarget); const status = $('#login-status'); status.textContent = 'Signing in…';
  const { error } = await client.auth.signInWithPassword({ email: form.get('email'), password: form.get('password') });
  if (error) { status.textContent = 'Unable to sign in. Check your email and password.'; return; }
  await openApp();
}
function showView(view) {
  $$('.view').forEach(node => node.hidden = node.id !== view); $$('.nav-item').forEach(node => node.classList.toggle('active', node.dataset.view === view));
  const titles = { dashboard:['OVERVIEW','Good to see you.'], settings:['ACADEMY SETTINGS','Academy information'], content:['CONTENT MANAGER','Keep every section current.'], gallery:['MEDIA LIBRARY','Gallery & image uploads'], enquiries:['LEADS','Admission & contact enquiries'] };
  $('#section-label').textContent = titles[view][0]; $('#page-title').textContent = titles[view][1];
  if (view === 'dashboard') loadDashboard(); if (view === 'settings') loadSettings(); if (view === 'content') renderEditor(); if (view === 'gallery') loadGallery(); if (view === 'enquiries') loadEnquiries();
}
async function loadDashboard() {
  for (const [table, node] of [['admissions','#admission-count'],['contact_messages','#message-count'],['gallery','#gallery-count']]) {
    const { count } = await client.from(table).select('*', { count:'exact', head:true }); $(node).textContent = count ?? '—';
  }
}
async function loadSettings() {
  const { data, error } = await client.from('academy_settings').select('*'); if (error) return toast('Could not load settings.');
  const values = Object.fromEntries(data.map(row => [row.setting_key,row.setting_value])); $$('#settings-form input, #settings-form textarea').forEach(input => input.value = values[input.name] || '');
}
async function saveSettings(event) {
  event.preventDefault(); const values = new FormData(event.currentTarget); const rows = [...values.entries()].map(([setting_key, setting_value]) => ({ setting_key, setting_value }));
  const { error } = await client.from('academy_settings').upsert(rows); toast(error ? 'Save failed.' : 'Academy information saved.');
}
function renderEditor(record = {}) {
  const fields = specs[currentResource]; const title = currentResource.replace('_',' '); editingId = record.id || null;
  $('#editor').innerHTML = `<h2>${editingId ? 'Edit' : 'Add'} ${escape(title)}</h2><form id="record-form" class="form-grid">${fields.map(([name,label,type='text']) => `<label class="${type==='textarea'?'full':''}">${escape(label)}<${type==='textarea'?'textarea':'input'} ${type==='textarea'?'':'type="'+type+'"'} name="${name}" value="${type==='textarea'?'':escape(record[name] ?? '')}">${type==='textarea'?escape(record[name] ?? '')+'</textarea>':''}</label>`).join('')}<button type="submit">${editingId ? 'Save changes' : 'Create item'}</button>${editingId ? '<button type="button" id="cancel-edit">Cancel</button>':''}</form>`;
  $('#record-form').onsubmit = saveRecord; $('#cancel-edit')?.addEventListener('click', () => renderEditor()); loadContentList();
}
async function saveRecord(event) {
  event.preventDefault(); const payload = Object.fromEntries(new FormData(event.currentTarget));
  for (const key of ['fee','experience_years','rating','sort_order']) if (key in payload) payload[key] = payload[key] === '' ? null : Number(payload[key]);
  const request = editingId ? client.from(currentResource).update(payload).eq('id',editingId) : client.from(currentResource).insert(payload);
  const { error } = await request; if (error) return toast('Save failed: '+error.message); toast('Saved successfully.'); renderEditor();
}
async function loadContentList() {
  const { data, error } = await client.from(currentResource).select('*').order('sort_order',{ascending:true}); if (error) return $('#content-list').textContent = 'Could not load items.';
  $('#content-list').innerHTML = data.length ? data.map(row => `<div class="data-row"><div class="copy"><b>${escape(row.title || row.full_name || row.name || row.person_name)}</b><small>${escape(row.description || row.role || row.summary || row.review || '')}</small></div><button data-edit="${row.id}">Edit</button><button class="delete" data-delete="${row.id}">Delete</button></div>`).join('') : '<p>No items yet.</p>';
  $$('[data-edit]').forEach(button => button.onclick = () => renderEditor(data.find(row => row.id === button.dataset.edit))); $$('[data-delete]').forEach(button => button.onclick = () => deleteRow(currentResource, button.dataset.delete, loadContentList));
}
async function uploadImage(event) {
  event.preventDefault(); const form = new FormData(event.currentTarget), file = form.get('image'); if (!file?.size) return; if (file.size > 10 * 1024 * 1024) return toast('Image must be under 10 MB.');
  const safeName = `${Date.now()}-${file.name.toLowerCase().replace(/[^a-z0-9.]+/g,'-')}`; toast('Uploading image…');
  const { error: uploadError } = await client.storage.from('academy-media').upload(`gallery/${safeName}`, file, { contentType:file.type, upsert:false }); if (uploadError) return toast('Upload failed: '+uploadError.message);
  const { data: url } = client.storage.from('academy-media').getPublicUrl(`gallery/${safeName}`); const { error } = await client.from('gallery').insert({ title:form.get('title'), category:form.get('category'), alt_text:form.get('alt_text'), image_url:url.publicUrl });
  if (error) return toast('Image uploaded but record could not be saved.'); event.currentTarget.reset(); toast('Gallery image published.'); loadGallery();
}
async function loadGallery() {
  const { data, error } = await client.from('gallery').select('*').order('created_at',{ascending:false}); if (error) return $('#gallery-list').textContent = 'Could not load gallery.';
  $('#gallery-list').innerHTML = data.map(row => `<article class="image-card"><img src="${escape(row.image_url)}" alt="${escape(row.alt_text)}"><div>${escape(row.title)}<br><button data-gallery-delete="${row.id}">Delete</button></div></article>`).join('') || '<p>No gallery images yet.</p>';
  $$('[data-gallery-delete]').forEach(button => button.onclick = () => deleteRow('gallery', button.dataset.galleryDelete, loadGallery));
}
async function loadEnquiries() {
  const table = $('#enquiry-select').value; const { data, error } = await client.from(table).select('*').order('created_at',{ascending:false}); if (error) return $('#enquiry-list').textContent = 'Could not load enquiries.';
  $('#enquiry-list').innerHTML = data.map(row => `<div class="data-row"><div class="copy"><b>${escape(row.full_name || row.name)} · ${escape(row.phone)}</b><small>${escape(row.email)} — ${escape(row.message || row.preferred_program || '')}</small></div><select data-status="${row.id}"><option ${row.status==='new'?'selected':''}>new</option><option ${row.status==='contacted'||row.status==='read'?'selected':''}>${table==='admissions'?'contacted':'read'}</option><option ${row.status==='enrolled'||row.status==='resolved'?'selected':''}>${table==='admissions'?'enrolled':'resolved'}</option></select></div>`).join('') || '<p>No enquiries yet.</p>';
  $$('[data-status]').forEach(select => select.onchange = async () => { const {error} = await client.from(table).update({status:select.value}).eq('id',select.dataset.status); toast(error?'Status update failed.':'Status updated.'); });
}
async function deleteRow(table, id, refresh) { if (!confirm('Delete this item permanently?')) return; const { error } = await client.from(table).delete().eq('id',id); toast(error ? 'Delete failed.' : 'Item deleted.'); refresh(); }

$('#login-form').onsubmit = signIn; $('#settings-form').onsubmit = saveSettings; $('#upload-form').onsubmit = uploadImage; $('#resource-select').onchange = event => { currentResource = event.target.value; renderEditor(); }; $('#new-record').onclick = () => renderEditor(); $('#enquiry-select').onchange = loadEnquiries; $$('.nav-item').forEach(button => button.onclick = () => showView(button.dataset.view)); $$('[data-go]').forEach(button => button.onclick = () => showView(button.dataset.go)); $('#signout').onclick = async () => { await client.auth.signOut(); location.reload(); }; boot();
