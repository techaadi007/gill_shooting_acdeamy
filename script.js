const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const cfg = window.GILL_SUPABASE_CONFIG;
const db = cfg?.url && cfg?.publishableKey && window.supabase ? window.supabase.createClient(cfg.url, cfg.publishableKey) : null;
const photo = $('.hero-photo');
if (photo) photo.outerHTML = '<video class="hero-video" autoplay muted loop playsinline preload="metadata" poster="assets/target-paper.jpg"><source src="assets/shooting-range.mp4" type="video/mp4"></video>';
$('.menu')?.addEventListener('click', () => $('nav')?.classList.toggle('open'));
window.addEventListener('scroll', () => $('.nav')?.classList.toggle('scrolled', scrollY > 30));
const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); if (e.target.classList.contains('counter')) count(e.target); } }), {threshold:.16});
const observe = root => root.querySelectorAll?.('.reveal').forEach(el => observer.observe(el)); observe(document);
function count(el) { if (el.dataset.done) return; el.dataset.done = '1'; const end = +el.dataset.count, start = performance.now(); const step = t => { const n = Math.min((t - start) / 1400, 1); el.firstChild.nodeValue = Math.floor(end * (1 - Math.pow(1 - n, 3))) + (n === 1 ? '+' : ''); if (n < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
const group = category => ['10m_range','50m_range'].includes(category) ? category : ['25m_range'].includes(category) ? 'range' : ['events','competitions'].includes(category) ? 'event' : category;
const galleryFilters = $('.gallery-filters');
if (galleryFilters && !galleryFilters.querySelector('[data-filter="50m_range"]')) galleryFilters.insertAdjacentHTML('afterbegin','<button data-filter="50m_range">50M Rifle</button>');
const galleryHeading = $('.gallery .section-heading h2'); if (galleryHeading) galleryHeading.textContent = '10M & 50M Rifle Shooting';
const initialGallery = $('#gallery-grid'), fiftyMetreTemplate = $('#fifty-metre-gallery');
if (initialGallery && fiftyMetreTemplate) initialGallery.insertAdjacentHTML('beforeend', fiftyMetreTemplate.innerHTML);
const localGalleryMarkup = initialGallery?.innerHTML || '';
function wireGallery() {
  $$('.gallery-filters button').forEach(button => button.onclick = () => { $$('.gallery-filters button').forEach(x => x.classList.remove('selected')); button.classList.add('selected'); $$('#gallery-grid .gallery-item').forEach(item => item.style.display = button.dataset.filter === 'all' || item.dataset.category === button.dataset.filter ? 'block' : 'none'); });
  $$('#gallery-grid .gallery-item').forEach(item => item.onclick = () => { const box = $('.lightbox'); box.querySelector('img').src = item.dataset.image; box.showModal(); });
}
$('.lightbox button')?.addEventListener('click', () => $('.lightbox').close()); wireGallery();
async function loadContent() {
  if (!db) return;
  const [programs, coaches, gallery, settings] = await Promise.all([db.from('programs').select('*').eq('is_active',true).order('sort_order'),db.from('coaches').select('*').eq('is_active',true).order('sort_order'),db.from('gallery').select('*').order('sort_order'),db.from('academy_settings').select('setting_key,setting_value')]);
  if (!programs.error && programs.data?.length) $('#program-grid').innerHTML = programs.data.map((p,i) => { const f = Array.isArray(p.features) ? p.features : []; return `<article class="program ${i===1?'featured':''} reveal visible"><span>${String(i+1).padStart(2,'0')}</span><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><ul>${f.map(x=>`<li>${esc(x)}</li>`).join('')}<li>${esc(p.duration || (p.fee ? 'Fee: ₹'+p.fee : ''))}</li></ul><a class="text-link" href="#admission">Enquire Now →</a></article>`; }).join('');
  if (!coaches.error && coaches.data?.length) $('#coach-grid').innerHTML = coaches.data.map(c => `<article class="coach reveal visible"><img src="${esc(c.photo_url || 'assets/target-paper.jpg')}" alt="${esc(c.full_name)}"><div><h3>${esc(c.full_name)}</h3><p>${esc(c.role)}${c.specialization?' · '+esc(c.specialization):''}</p></div></article>`).join('');
  if (!gallery.error && gallery.data?.length) { $('#gallery-grid').innerHTML = localGalleryMarkup + gallery.data.map((g,i) => `<button class="gallery-item ${i===0?'tall':i===2?'wide':''}" data-category="${group(g.category)}" data-image="${esc(g.image_url)}" style="background-image:url('${esc(g.image_url)}')"><span>${esc(g.title)}</span></button>`).join(''); wireGallery(); }
  if (!settings.error && settings.data?.length) { const v = Object.fromEntries(settings.data.map(x=>[x.setting_key,x.setting_value])); const p=$$('.contact-points span'); if(v.phone&&p[0])p[0].textContent=`☎ ${v.phone}`; if(v.email&&p[1])p[1].textContent=`✉ ${v.email}`; if(v.address&&p[2])p[2].textContent=`⌖ ${v.address}`; $$('a[href*="wa.me/"]').forEach(a=>{if(v.whatsapp)a.href=`https://wa.me/${v.whatsapp.replace(/\D/g,'')}`}); }
}
loadContent();
$('#admission-form')?.addEventListener('submit', async e => { e.preventDefault(); const form=e.currentTarget,status=$('.form-status'),v=Object.fromEntries(new FormData(form)); status.textContent='Sending your application…'; if(!db){status.textContent='Connection unavailable. Please contact us on WhatsApp.';return;} const {error}=await db.from('admissions').insert({full_name:v.name,phone:v.phone,email:v.email,preferred_program:v.program,message:v.message||null}); if(error){status.textContent='Could not send right now. Please contact us on WhatsApp.';return;} status.textContent='Thank you — your enquiry has been received.';form.reset(); });
