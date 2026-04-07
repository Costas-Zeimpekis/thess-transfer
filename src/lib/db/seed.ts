import { db } from './index'
import { drivers, partners, providers, providerEmails, users, vehicles } from './schema'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('Seeding providers...')

  const providerData = [
    {
      name: 'Airports Taxi Transfers',
      slug: 'airports-taxi-transfers',
      emails: [{ email: 'bookings@airportstaxitransfers.com', operation: 'all' as const }],
    },
    {
      name: 'Foxtransfer EU',
      slug: 'foxtransfer-eu',
      emails: [{ email: 'info@foxtransfer.eu', operation: 'all' as const }],
    },
    {
      name: 'Cheap-Taxis',
      slug: 'cheap-taxis',
      emails: [{ email: 'bookings@cheap-taxis.com', operation: 'all' as const }],
    },
    {
      name: 'Talixo',
      slug: 'talixo',
      emails: [
        { email: 'info@talixo.de', operation: 'booking' as const },
        { email: 'do-not-reply@talixo.de', operation: 'modification' as const },
      ],
    },
    {
      name: 'ZIPTRANSFERS',
      slug: 'ziptransfers',
      emails: [{ email: 'reservations@ziptransfers.com', operation: 'all' as const }],
    },
    {
      name: 'JOURNEE',
      slug: 'journee',
      emails: [{ email: 'partnerships@journeetrips.com', operation: 'all' as const }],
    },
    {
      name: 'ShuttleDirect',
      slug: 'shuttledirect',
      emails: [{ email: 'blackhole@shuttledirect.com', operation: 'all' as const }],
    },
    {
      name: 'Mozio',
      slug: 'mozio',
      emails: [{ email: 'provider-do-not-reply@mozio.com', operation: 'all' as const }],
    },
    {
      name: 'Transfers Thessaloniki',
      slug: 'transfers-thessaloniki',
      emails: [{ email: 'info@transfersthessaloniki.com', operation: 'all' as const }],
    },
  ]

  for (const p of providerData) {
    const [inserted] = await db
      .insert(providers)
      .values({ name: p.name, slug: p.slug })
      .onConflictDoNothing()
      .returning({ id: providers.id })

    if (inserted) {
      for (const e of p.emails) {
        await db
          .insert(providerEmails)
          .values({ providerId: inserted.id, email: e.email, operation: e.operation })
          .onConflictDoNothing()
      }
    }
  }

  console.log('Seeding admin user...')
  const passwordHash = await bcrypt.hash('admin123', 12)
  await db
    .insert(users)
    .values({ username: 'admin', passwordHash })
    .onConflictDoNothing()

  console.log('Done! Default credentials: admin / admin123 — change immediately.')

  console.log('Seeding mock drivers...')
  const mockDrivers = [
    { fullName: 'Νίκος Παπαδόπουλος', phone: '6971234501', email: 'nikos.papadopoulos@email.com', idCard: 'ΑΒ123401', active: true },
    { fullName: 'Γιάννης Αναστασίου', phone: '6971234502', email: 'giannis.anastassiou@email.com', idCard: 'ΑΒ123402', active: true },
    { fullName: 'Κώστας Δημητρίου', phone: '6971234503', email: 'kostas.dimitriou@email.com', idCard: 'ΑΒ123403', active: true },
    { fullName: 'Θανάσης Γεωργίου', phone: '6971234504', email: 'thanasis.georgiou@email.com', idCard: 'ΑΒ123404', active: true },
    { fullName: 'Σπύρος Κωνσταντίνου', phone: '6971234505', email: 'spyros.konstantinou@email.com', idCard: 'ΑΒ123405', active: true },
    { fullName: 'Βασίλης Αλεξίου', phone: '6971234506', email: 'vasilis.alexiou@email.com', idCard: 'ΑΒ123406', active: true },
    { fullName: 'Παναγιώτης Νικολάου', phone: '6971234507', email: 'panagiotis.nikolaou@email.com', idCard: 'ΑΒ123407', active: true },
    { fullName: 'Δημήτρης Σταματίου', phone: '6971234508', email: 'dimitris.stamatiou@email.com', idCard: 'ΑΒ123408', active: true },
    { fullName: 'Ηλίας Ζαχαρόπουλος', phone: '6971234509', email: 'ilias.zacharopoulos@email.com', idCard: 'ΑΒ123409', active: true },
    { fullName: 'Χρήστος Λαμπρόπουλος', phone: '6971234510', email: 'christos.lampropoulos@email.com', idCard: 'ΑΒ123410', active: true },
    { fullName: 'Στέφανος Μαρκόπουλος', phone: '6971234511', email: 'stefanos.markopoulos@email.com', idCard: 'ΑΒ123411', active: true },
    { fullName: 'Αντώνης Παππάς', phone: '6971234512', email: 'antonis.pappas@email.com', idCard: 'ΑΒ123412', active: true },
    { fullName: 'Μιχάλης Σπηλιωτόπουλος', phone: '6971234513', email: 'michalis.spiliot@email.com', idCard: 'ΑΒ123413', active: true },
    { fullName: 'Τάκης Βουλγαράκης', phone: '6971234514', email: 'takis.voulgarakis@email.com', idCard: 'ΑΒ123414', active: true },
    { fullName: 'Λευτέρης Τσέλιος', phone: '6971234515', email: 'lefteris.tselios@email.com', idCard: 'ΑΒ123415', active: true },
    { fullName: 'Γιώργης Μανώλης', phone: '6971234516', email: 'giorhis.manolis@email.com', idCard: 'ΑΒ123416', active: true },
    { fullName: 'Πέτρος Χατζηδάκης', phone: '6971234517', email: 'petros.chatzidakis@email.com', idCard: 'ΑΒ123417', active: true },
    { fullName: 'Σωτήρης Καραμάνης', phone: '6971234518', email: 'sotiris.karamanis@email.com', idCard: 'ΑΒ123418', active: true },
    { fullName: 'Αλέξανδρος Βέργος', phone: '6971234519', email: 'alexandros.vergos@email.com', idCard: 'ΑΒ123419', active: true },
    { fullName: 'Κυριάκος Θεοδωρίδης', phone: '6971234520', email: 'kyriakos.theodoridis@email.com', idCard: 'ΑΒ123420', active: true },
    { fullName: 'Γρηγόρης Μπαλής', phone: '6971234521', email: 'grigoris.balis@email.com', idCard: 'ΑΒ123421', active: true },
    { fullName: 'Νεκτάριος Κυριαζής', phone: '6971234522', email: 'nektarios.kyriazis@email.com', idCard: 'ΑΒ123422', active: false },
    { fullName: 'Ορέστης Δελής', phone: '6971234523', email: 'orestis.delis@email.com', idCard: 'ΑΒ123423', active: false },
    { fullName: 'Φώτης Αργυρόπουλος', phone: '6971234524', email: 'fotis.argyropoulos@email.com', idCard: 'ΑΒ123424', active: false },
    { fullName: 'Ευάγγελος Σκουλάς', phone: '6971234525', email: 'evangelos.skoulas@email.com', idCard: 'ΑΒ123425', active: false },
  ]

  for (const d of mockDrivers) {
    await db.insert(drivers).values(d).onConflictDoNothing()
  }

  console.log('Seeded 25 mock drivers.')

  console.log('Seeding mock vehicles...')
  const mockVehicles = [
    { name: 'Mercedes E-Class 1', plate: 'ΘΚΚ-1001', type: 'car' as const, brand: 'Mercedes-Benz', active: true },
    { name: 'Toyota Camry 2', plate: 'ΘΚΚ-1002', type: 'car' as const, brand: 'Toyota', active: true },
    { name: 'BMW 5 Series 3', plate: 'ΘΚΚ-1003', type: 'car' as const, brand: 'BMW', active: true },
    { name: 'Audi A6 4', plate: 'ΘΚΚ-1004', type: 'car' as const, brand: 'Audi', active: true },
    { name: 'Volkswagen Passat 5', plate: 'ΘΚΚ-1005', type: 'car' as const, brand: 'Volkswagen', active: true },
    { name: 'Skoda Superb 6', plate: 'ΘΚΚ-1006', type: 'car' as const, brand: 'Skoda', active: true },
    { name: 'Hyundai Sonata 7', plate: 'ΘΚΚ-1007', type: 'car' as const, brand: 'Hyundai', active: true },
    { name: 'Volvo S90 8', plate: 'ΘΚΚ-1008', type: 'car' as const, brand: 'Volvo', active: true },
    { name: 'Ford Mondeo 9', plate: 'ΘΚΚ-1009', type: 'car' as const, brand: 'Ford', active: true },
    { name: 'Peugeot 508 10', plate: 'ΘΚΚ-1010', type: 'car' as const, brand: 'Peugeot', active: true },
    { name: 'Mercedes Vito 11', plate: 'ΘΚΚ-1011', type: 'van' as const, brand: 'Mercedes-Benz', active: true },
    { name: 'Volkswagen Transporter 12', plate: 'ΘΚΚ-1012', type: 'van' as const, brand: 'Volkswagen', active: true },
    { name: 'Ford Transit 13', plate: 'ΘΚΚ-1013', type: 'van' as const, brand: 'Ford', active: true },
    { name: 'Renault Traffic 14', plate: 'ΘΚΚ-1014', type: 'van' as const, brand: 'Renault', active: true },
    { name: 'Peugeot Expert 15', plate: 'ΘΚΚ-1015', type: 'van' as const, brand: 'Peugeot', active: true },
    { name: 'Mercedes Viano 16', plate: 'ΘΚΚ-1016', type: 'van' as const, brand: 'Mercedes-Benz', active: true },
    { name: 'Volkswagen Crafter 17', plate: 'ΘΚΚ-1017', type: 'van' as const, brand: 'Volkswagen', active: true },
    { name: 'Iveco Daily 18', plate: 'ΘΚΚ-1018', type: 'van' as const, brand: 'Iveco', active: true },
    { name: 'Mercedes Sprinter 19', plate: 'ΘΚΚ-1019', type: 'van' as const, brand: 'Mercedes-Benz', active: true },
    { name: 'Toyota HiAce 20', plate: 'ΘΚΚ-1020', type: 'van' as const, brand: 'Toyota', active: true },
    { name: 'Setra S 415 21', plate: 'ΘΚΚ-1021', type: 'bus' as const, brand: 'Setra', active: true },
    { name: 'Mercedes Tourismo 22', plate: 'ΘΚΚ-1022', type: 'bus' as const, brand: 'Mercedes-Benz', active: true },
    { name: 'Volvo 9700 23', plate: 'ΘΚΚ-1023', type: 'bus' as const, brand: 'Volvo', active: true },
    { name: 'MAN Lion\'s Coach 24', plate: 'ΘΚΚ-1024', type: 'bus' as const, brand: 'MAN', active: false },
    { name: 'Neoplan Cityliner 25', plate: 'ΘΚΚ-1025', type: 'bus' as const, brand: 'Neoplan', active: false },
  ]

  for (const v of mockVehicles) {
    await db.insert(vehicles).values(v).onConflictDoNothing()
  }

  console.log('Seeded 25 mock vehicles.')

  console.log('Seeding mock partners...')
  const mockPartners = [
    { name: 'Αεροδρόμιο Transfers A.E.', email: 'info@aerodromio-transfers.gr', phone: '2310100001', contactInfo: 'Κτήριο Α, Αερολ. Μακεδονία' },
    { name: 'Θεσσαλονίκη Taxi Services', email: 'contact@thessaloniki-taxi.gr', phone: '2310100002', contactInfo: 'Λεωφ. Νίκης 22, Θεσσαλονίκη' },
    { name: 'Βόρεια Ελλάδα Transfers', email: 'info@northgreece-transfers.gr', phone: '2310100003', contactInfo: null },
    { name: 'Makedonia Travel', email: 'bookings@makedonia-travel.gr', phone: '2310100004', contactInfo: 'Εγνατία 45, Θεσσαλονίκη' },
    { name: 'Olympos Transport', email: 'info@olympos-transport.gr', phone: '2310100005', contactInfo: null },
    { name: 'Ήλιος Transfers', email: 'ilios@transfers.gr', phone: '6944100006', contactInfo: 'Βασ. Όλγας 10, Θεσσαλονίκη' },
    { name: 'Balkan Transfers Ltd', email: 'ops@balkan-transfers.com', phone: '2310100007', contactInfo: null },
    { name: 'Alpha Limousine Service', email: 'alpha@limousine.gr', phone: '2310100008', contactInfo: 'Τσιμισκή 80, Θεσσαλονίκη' },
    { name: 'Κεντρική Μακεδονία Tourism', email: 'info@km-tourism.gr', phone: '2310100009', contactInfo: null },
    { name: 'Hellenic Car Service', email: 'contact@hellenic-carservice.gr', phone: '6944100010', contactInfo: 'Μοναστηρίου 120, Θεσσαλονίκη' },
    { name: 'Premium VIP Transfers', email: 'vip@premium-transfers.gr', phone: '2310100011', contactInfo: null },
    { name: 'City Shuttle Thessaloniki', email: 'info@cityshuttle.gr', phone: '6944100012', contactInfo: 'Δ. Γούναρη 5, Θεσσαλονίκη' },
    { name: 'Μεταφορές Αδελφοί Νικολάου', email: null, phone: '6944100013', contactInfo: 'Κ. Καρταλή 33, Βέροια' },
    { name: 'Euro Transfer Solutions', email: 'info@eurotransfer.gr', phone: '2310100014', contactInfo: null },
    { name: 'Ταξί Σύνδεσμος Θεσσαλονίκης', email: 'syndemos@taxithess.gr', phone: '2310100015', contactInfo: 'Αριστοτέλους 6, Θεσσαλονίκη' },
    { name: 'North Star Travel Agency', email: 'info@northstar-travel.gr', phone: '6944100016', contactInfo: null },
    { name: 'Royal Ground Transport', email: 'royal@groundtransport.gr', phone: '2310100017', contactInfo: 'Πλ. Αριστοτέλους 12, Θεσσαλονίκη' },
    { name: 'Express Ride Hellas', email: 'express@ridehellas.gr', phone: '6944100018', contactInfo: null },
    { name: 'Αξιός Transfers', email: 'axios@transfers.gr', phone: '2310100019', contactInfo: 'Παύλου Μελά 7, Θεσσαλονίκη' },
    { name: 'Λευκός Πύργος Transports', email: 'info@lefkospyrgos-transport.gr', phone: '2310100020', contactInfo: null },
    { name: 'Thermo Transfers', email: null, phone: '6944100021', contactInfo: 'Λαγκαδάς, Θεσσαλονίκη' },
    { name: 'Ηρακλής Logistics', email: 'info@iraklis-logistics.gr', phone: '2310100022', contactInfo: null },
    { name: 'Μετρό & Μεταφορές Α.Ε.', email: 'metro@metafores.gr', phone: '2310100023', contactInfo: 'Σινδός, Θεσσαλονίκη' },
    { name: 'Sundrive Hellas', email: 'sundrive@hellas.gr', phone: '6944100024', contactInfo: null },
    { name: 'Καλαμαριά Transfer Club', email: 'info@kalamaria-transfer.gr', phone: '2310100025', contactInfo: 'Κομνηνών 3, Καλαμαριά' },
  ]

  for (const p of mockPartners) {
    await db.insert(partners).values(p).onConflictDoNothing()
  }

  console.log('Seeded 25 mock partners.')
}

seed().catch(console.error)
