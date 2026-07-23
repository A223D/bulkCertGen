export type UseCaseFaq = {
  question: string;
  answer: string;
};

export type UseCasePage = {
  slug: string;
  title: string;
  shortTitle: string;
  metadataTitle: string;
  metadataDescription: string;
  kicker: string;
  heroTitle: string;
  heroBody: string;
  imageSrc: string;
  imageAlt: string;
  audience: string[];
  painPoints: string[];
  csvColumns: string[];
  workflow: string[];
  outputs: string[];
  faqs: UseCaseFaq[];
};

export const useCasePages: UseCasePage[] = [
  {
    slug: "certificate-generator-from-csv",
    title: "Certificate generator from CSV",
    shortTitle: "Certificates",
    metadataTitle: "Certificate Generator from CSV",
    metadataDescription:
      "Create personalized certificates from a CSV spreadsheet and a certificate design. Upload rows, place fields, preview names, and export PDFs in bulk.",
    kicker: "CSV certificate generator",
    heroTitle: "Make personalized certificates from a spreadsheet.",
    heroBody:
      "Batch, Please turns a list of students, attendees, graduates, or award winners into finished certificate PDFs. Upload a CSV, choose a certificate design or bring your own PNG/JPG, place the fields, and export up to 500 certificates per batch.",
    imageSrc: "/starter-designs/certificate-modern.png",
    imageAlt: "Modern certificate design used as a Batch, Please starter template",
    audience: ["Teachers and trainers", "Course creators", "Award coordinators"],
    painPoints: [
      "Typing every recipient name into a certificate by hand",
      "Duplicating one design hundreds of times",
      "Finding long names only after the PDFs are exported",
    ],
    csvColumns: ["full_name", "course_name", "completion_date", "award_title", "instructor"],
    workflow: [
      "Export your spreadsheet as a CSV with one recipient per row.",
      "Choose a built-in certificate or upload your own certificate background.",
      "Place name, course, date, and award fields where they belong.",
      "Preview real rows and fix any text-fit warnings before export.",
    ],
    outputs: [
      "One combined certificate PDF",
      "Separate certificate PDFs in a ZIP",
      "Letter-size certificates from your own design",
    ],
    faqs: [
      {
        question: "Can I use my own certificate design?",
        answer:
          "Yes. Upload a PNG or JPG certificate with blank spaces, then place CSV fields such as name, course, date, and award on top of it.",
      },
      {
        question: "How many certificates can I generate at once?",
        answer:
          "You can process up to 500 CSV rows per batch and export either one combined PDF or separate PDFs.",
      },
      {
        question: "Does Batch, Please replace mail merge for certificates?",
        answer:
          "For simple certificate batches, yes. It is built for CSV-to-PDF personalization without Word mail merge, formulas, or account setup.",
      },
    ],
  },
  {
    slug: "event-badges-from-spreadsheet",
    title: "Event badges from spreadsheet",
    shortTitle: "Event badges",
    metadataTitle: "Event Badges from a Spreadsheet",
    metadataDescription:
      "Generate conference badges, meetup badges, and attendee passes from spreadsheet rows. Upload a CSV, map badge fields, and export printable PDFs.",
    kicker: "Spreadsheet to event badges",
    heroTitle: "Create event badges without editing each badge.",
    heroBody:
      "Use Batch, Please to turn attendee spreadsheets into conference badges, meetup badges, speaker tags, and volunteer credentials. Map names, roles, companies, sessions, and badge numbers onto a design, then export print-ready PDFs.",
    imageSrc: "/starter-designs/name-badge-modern.png",
    imageAlt: "Modern name badge design used as a Batch, Please starter template",
    audience: ["Conference teams", "Meetup organizers", "Workshop coordinators"],
    painPoints: [
      "Manually copying attendee names into a badge file",
      "Keeping roles, companies, and sessions aligned",
      "Printing badges only to notice clipped titles",
    ],
    csvColumns: ["attendee_name", "company", "role", "badge_type", "session"],
    workflow: [
      "Start with the attendee export from your registration tool.",
      "Choose a name badge design or upload your event-branded badge artwork.",
      "Place attendee, company, role, and badge-type fields on the badge.",
      "Use several-on-a-page export to make printable badge sheets.",
    ],
    outputs: [
      "Printable badge sheets",
      "Separate PDFs for late registrations",
      "Custom badge sizes for event holders",
    ],
    faqs: [
      {
        question: "Can I make conference badges from a registration export?",
        answer:
          "Yes. Save the attendee export as CSV, then map the registration columns to the badge design.",
      },
      {
        question: "Can badges be printed several per page?",
        answer:
          "Yes. For smaller badge sizes, Batch, Please can place several personalized badges on each sheet.",
      },
      {
        question: "Can I include company names or attendee roles?",
        answer:
          "Yes. Any CSV column can become a text field, including company, role, ticket type, session, table, or badge number.",
      },
    ],
  },
  {
    slug: "id-cards-from-csv",
    title: "ID cards from CSV",
    shortTitle: "ID cards",
    metadataTitle: "ID Cards from CSV",
    metadataDescription:
      "Create simple staff, student, club, or member ID cards from CSV rows and an image design. Preview fields and export personalized card PDFs.",
    kicker: "CSV ID card maker",
    heroTitle: "Turn member lists into simple ID card PDFs.",
    heroBody:
      "Batch, Please helps small teams create repeatable ID-style cards from a spreadsheet. Bring names, member numbers, roles, groups, or expiry dates in a CSV and place them onto an uploaded card design.",
    imageSrc: "/starter-designs/name-badge-classic.png",
    imageAlt: "Classic name badge design that can be adapted for ID-style cards",
    audience: ["Clubs and associations", "Small businesses", "Schools and programs"],
    painPoints: [
      "Rebuilding the same card for every member",
      "Copying ID numbers and expiry dates by hand",
      "Needing a practical PDF output instead of a full design platform",
    ],
    csvColumns: ["member_name", "member_id", "group", "expiry_date", "role"],
    workflow: [
      "Prepare a CSV with one person or member per row.",
      "Upload a card background with blank spaces for the details.",
      "Place name, ID, role, and expiry fields on the design.",
      "Export one PDF per row or print multiple cards per sheet.",
    ],
    outputs: [
      "Member card PDFs",
      "Student or staff ID-style cards",
      "Print sheets for small cards",
    ],
    faqs: [
      {
        question: "Can I generate ID cards from member data?",
        answer:
          "Yes. If your member data is in a CSV, you can place each column on an ID-style card design and export PDFs.",
      },
      {
        question: "Does Batch, Please store member data?",
        answer:
          "Uploaded spreadsheets and designs are never stored. A copy of the generated PDF or ZIP is kept privately for 7 days so misuse of this free tool can be investigated, then deleted automatically.",
      },
      {
        question: "Can I add photos to each ID card?",
        answer:
          "No. Current fields are text fields placed over a PNG or JPG design. Per-row photo merging is not supported.",
      },
    ],
  },
  {
    slug: "mailing-labels-from-csv",
    title: "Mailing labels from CSV",
    shortTitle: "Mailing labels",
    metadataTitle: "Mailing Labels from CSV",
    metadataDescription:
      "Generate mailing labels, address labels, return labels, and simple label sheets from CSV data and a label design.",
    kicker: "CSV mailing label generator",
    heroTitle: "Make mailing labels from address rows.",
    heroBody:
      "Use Batch, Please when a spreadsheet has the addresses and you need printable label PDFs. Map name, address, city, region, postal code, and custom message fields onto a label design, then export as sheets or PDFs.",
    imageSrc: "/starter-designs/mailing-label-modern.png",
    imageAlt: "Modern mailing label design used as a Batch, Please starter template",
    audience: ["Office teams", "Clubs and nonprofits", "Small shops"],
    painPoints: [
      "Pasting addresses into a label file one at a time",
      "Combining name, address, and postal-code fields manually",
      "Needing printable output without setting up a mail-merge document",
    ],
    csvColumns: ["name", "address_line_1", "city", "state", "postal_code"],
    workflow: [
      "Export the address list from Excel, Google Sheets, or your CRM as CSV.",
      "Choose a mailing-label starter or upload your own label artwork.",
      "Place each address field on the label in the order you want.",
      "Export a multi-label print sheet or individual label PDFs.",
    ],
    outputs: [
      "Address label sheets",
      "Return-address labels",
      "One PDF containing all rows",
    ],
    faqs: [
      {
        question: "Can I make address labels from Excel?",
        answer:
          "Yes. Save the Excel sheet as CSV, upload it, and map address columns onto a mailing-label design.",
      },
      {
        question: "Can labels print multiple per page?",
        answer:
          "Yes. Small label designs can be exported several on a page with margins, gaps, and optional crop marks.",
      },
      {
        question: "Are multi-line address cells supported?",
        answer:
          "Batch, Please works best when address parts are separate CSV columns, such as address line, city, state, and postal code.",
      },
    ],
  },
  {
    slug: "appointment-cards-from-csv",
    title: "Appointment cards from CSV",
    shortTitle: "Appointment cards",
    metadataTitle: "Appointment Cards from CSV",
    metadataDescription:
      "Create printable appointment cards from a CSV schedule. Place names, dates, times, provider names, and locations onto a card design.",
    kicker: "CSV appointment cards",
    heroTitle: "Generate appointment cards from a schedule spreadsheet.",
    heroBody:
      "Batch, Please can turn a simple appointment CSV into personalized card PDFs for clinics, salons, service businesses, tutors, or community programs. Use your own card artwork or a starter design, then map schedule fields onto it.",
    imageSrc: "/starter-designs/appointment-card-modern.png",
    imageAlt: "Modern appointment card design used as a Batch, Please starter template",
    audience: ["Clinics and offices", "Salons and service teams", "Tutors and programs"],
    painPoints: [
      "Writing the same appointment card details repeatedly",
      "Mixing up dates or times while copying from a schedule",
      "Needing printable cards without a scheduling-system template",
    ],
    csvColumns: ["client_name", "appointment_date", "appointment_time", "provider", "location"],
    workflow: [
      "Export or prepare a CSV schedule with one appointment per row.",
      "Choose an appointment-card design or upload your own card image.",
      "Place client, date, time, provider, and location fields on the card.",
      "Preview several rows to catch long names or location text.",
    ],
    outputs: [
      "Appointment-card print sheets",
      "Separate PDFs for each appointment",
      "Small card layouts with crop marks",
    ],
    faqs: [
      {
        question: "Can I make appointment cards from a schedule CSV?",
        answer:
          "Yes. Each row can become one card with fields such as client, date, time, provider, and location.",
      },
      {
        question: "Can I use my own appointment-card design?",
        answer:
          "Yes. Upload a PNG or JPG card design and place the schedule fields where they should print.",
      },
      {
        question: "Can cards be exported for cutting?",
        answer:
          "Yes. Several-on-a-page export supports print-sheet layouts and crop marks for small cards.",
      },
    ],
  },
  {
    slug: "table-cards-from-spreadsheet",
    title: "Table cards from spreadsheet",
    shortTitle: "Table cards",
    metadataTitle: "Table Cards from a Spreadsheet",
    metadataDescription:
      "Create table cards, seating cards, and place cards from spreadsheet rows. Upload a design, map names and table numbers, and export PDFs.",
    kicker: "Spreadsheet table cards",
    heroTitle: "Create table cards and place cards from guest lists.",
    heroBody:
      "For dinners, fundraisers, weddings, workshops, and reserved seating, Batch, Please turns a guest or table spreadsheet into personalized card PDFs. Map guest names, table names, seat numbers, meal notes, or groups onto a card design.",
    imageSrc: "/starter-designs/appointment-card-classic.png",
    imageAlt: "Classic card design that can be adapted for table cards or place cards",
    audience: ["Event planners", "Venue teams", "Community organizers"],
    painPoints: [
      "Re-typing names and table numbers after the seating plan changes",
      "Keeping guest names, table names, and meal notes together",
      "Creating polished cards without a custom print workflow",
    ],
    csvColumns: ["guest_name", "table_number", "seat", "meal", "group"],
    workflow: [
      "Prepare a CSV from the final guest list or seating plan.",
      "Upload a table-card, place-card, or tent-card image design.",
      "Place guest, table, seat, and note fields on the design.",
      "Export the cards as a combined PDF or a printable sheet.",
    ],
    outputs: [
      "Place-card PDFs",
      "Table-card sheets",
      "Separate files for last-minute changes",
    ],
    faqs: [
      {
        question: "Can I make place cards from a guest list?",
        answer:
          "Yes. Save the guest list as CSV and map guest names, table numbers, and seating fields onto your card design.",
      },
      {
        question: "Can I update cards after seating changes?",
        answer:
          "Yes. Upload the revised CSV and regenerate the batch. Batch, Please is designed for repeatable spreadsheet-driven output.",
      },
      {
        question: "Does Batch, Please design folded tent cards?",
        answer:
          "It personalizes an uploaded image design. Prepare the tent-card artwork first, then use Batch, Please to fill the variable fields.",
      },
    ],
  },
  {
    slug: "gift-tags-from-csv",
    title: "Gift tags from CSV",
    shortTitle: "Gift tags",
    metadataTitle: "Gift Tags from CSV",
    metadataDescription:
      "Generate personalized gift tags, favor tags, hamper tags, and simple product tags from CSV rows and an uploaded tag design.",
    kicker: "CSV gift tag generator",
    heroTitle: "Make personalized gift tags from a list.",
    heroBody:
      "Batch, Please is useful when one tag design needs many names, messages, groups, or item codes. Upload a tag artwork image, map your CSV columns onto the blank spaces, and export printable personalized tags.",
    imageSrc: "/starter-designs/mailing-label-classic.png",
    imageAlt: "Classic label design that can be adapted for gift tags",
    audience: ["Makers and small shops", "School groups", "Fundraisers and clubs"],
    painPoints: [
      "Editing every tag for each recipient or hamper",
      "Losing track of names, messages, or item codes",
      "Needing simple personalized print output without design software",
    ],
    csvColumns: ["recipient_name", "message", "item_code", "group", "from_name"],
    workflow: [
      "Create a CSV with one gift, favor, hamper, or product tag per row.",
      "Upload your tag image with blank spaces for personalized text.",
      "Place recipient, message, code, and sender fields on the tag.",
      "Export multiple tags per sheet for printing and trimming.",
    ],
    outputs: [
      "Printable gift-tag sheets",
      "Favor tags with names",
      "Product or hamper tags from item lists",
    ],
    faqs: [
      {
        question: "Can I create personalized tags from a spreadsheet?",
        answer:
          "Yes. Each CSV row can become one tag, and each column can be placed as text on the tag design.",
      },
      {
        question: "Can I print many gift tags on one page?",
        answer:
          "Yes. Small tag designs can be exported several per page with configurable margins and gaps.",
      },
      {
        question: "Can I include different messages per tag?",
        answer:
          "Yes. Put the message in a CSV column and place that column on your tag design.",
      },
    ],
  },
  {
    slug: "workshop-passes-from-spreadsheet",
    title: "Workshop passes from spreadsheet",
    shortTitle: "Workshop passes",
    metadataTitle: "Workshop Passes from a Spreadsheet",
    metadataDescription:
      "Create workshop passes, class passes, and simple session tickets from spreadsheet rows. Upload a design, map fields, and export PDFs.",
    kicker: "Spreadsheet workshop passes",
    heroTitle: "Generate workshop passes from registration rows.",
    heroBody:
      "Batch, Please turns registration spreadsheets into printable passes for workshops, classes, camps, training days, and sessions. Map participant names, session titles, times, rooms, and pass numbers onto your pass design.",
    imageSrc: "/starter-designs/name-badge-modern.png",
    imageAlt: "Modern badge design that can be adapted for workshop passes",
    audience: ["Workshop hosts", "Training teams", "Class coordinators"],
    painPoints: [
      "Creating session passes one participant at a time",
      "Keeping rooms, times, and registration numbers accurate",
      "Handling late additions without rebuilding every pass",
    ],
    csvColumns: ["participant_name", "session", "room", "start_time", "pass_number"],
    workflow: [
      "Export the registration list as CSV from your form or spreadsheet.",
      "Use a starter badge design or upload your own pass artwork.",
      "Place participant, session, room, time, and pass-number fields.",
      "Preview rows and export the finished pass PDFs.",
    ],
    outputs: [
      "Workshop pass sheets",
      "Separate PDFs for late registrants",
      "Class or session ticket PDFs",
    ],
    faqs: [
      {
        question: "Can I make workshop passes from Google Forms data?",
        answer:
          "Yes. Export the responses or linked Google Sheet as CSV, then map the columns onto a pass design.",
      },
      {
        question: "Can passes include room and session information?",
        answer:
          "Yes. Any spreadsheet column can be placed on the pass, including room, time, session title, group, or pass number.",
      },
      {
        question: "Can I regenerate only late registrants?",
        answer:
          "Yes. Create a CSV with just the late registrants and export those rows as a smaller batch.",
      },
    ],
  },
];

export function getUseCasePage(slug: string) {
  return useCasePages.find((page) => page.slug === slug);
}

export function getUseCasePath(slug: string) {
  return `/use-cases/${slug}`;
}
