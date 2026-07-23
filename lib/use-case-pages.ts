export type UseCaseFaq = {
  question: string;
  answer: string;
};

/**
 * Getting the list out of Excel or Google Sheets is the step people actually
 * get stuck on — the app only accepts CSV. Pages that answer a spreadsheet-shaped
 * search ("excel to certificate") carry these explicit export steps; the older
 * output-shaped pages ("mailing labels from CSV") do not need them.
 */
export type SpreadsheetSteps = {
  excel: string[];
  googleSheets: string[];
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
  spreadsheetSteps?: SpreadsheetSteps;
  /**
   * Explicit "related" slugs, used where two pages answer neighbouring searches
   * for the same job (e.g. `id-card-generator` and `id-cards-from-csv`). Linking
   * the pair directly tells a reader — and a crawler — that they are companions
   * rather than rivals for the same query. Falls back to the first three other
   * pages when unset.
   */
  relatedSlugs?: string[];
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
    relatedSlugs: [
      "bulk-certificate-generator",
      "excel-to-certificate",
      "google-sheets-to-certificate",
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
    relatedSlugs: [
      "event-badge-generator",
      "id-card-generator",
      "workshop-passes-from-spreadsheet",
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
    relatedSlugs: [
      "id-card-generator",
      "event-badge-generator",
      "mailing-labels-from-csv",
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
  {
    slug: "bulk-certificate-generator",
    title: "Bulk certificate generator",
    shortTitle: "Bulk certificates",
    metadataTitle: "Bulk Certificate Generator",
    metadataDescription:
      "Generate certificates in bulk from an Excel, Google Sheets, or CSV list. Up to 500 per batch as one combined PDF or separate files. Free, no account needed.",
    kicker: "Bulk certificate generator",
    heroTitle: "Generate a whole certificate run in one pass.",
    heroBody:
      "When the list is long, the work is the repetition. Batch, Please takes an Excel export, a Google Sheets download, or a CSV and produces the entire certificate run at once — up to 500 per batch, as a single combined PDF you can send to a printer or separate named files you can email out individually.",
    imageSrc: "/starter-designs/certificate-classic.png",
    imageAlt: "Classic certificate design used as a Batch, Please starter template",
    audience: ["Training providers", "Schools with many cohorts", "Certification programs"],
    painPoints: [
      "A cohort of 300 that has to go out the same afternoon",
      "Design tools that slow to a crawl once the list gets long",
      "Discovering one clipped name after the whole run is printed",
    ],
    csvColumns: [
      "recipient_name",
      "program",
      "cohort",
      "completion_date",
      "certificate_id",
    ],
    workflow: [
      "Download your recipient list from Excel or Google Sheets as a CSV.",
      "Pick a built-in certificate or upload your own PNG/JPG artwork.",
      "Place the fields once — they apply to every row in the batch.",
      "Check the preflight report, then export the run as one PDF or a ZIP.",
    ],
    outputs: [
      "One combined PDF, one certificate per page",
      "A ZIP of separately named certificate PDFs",
      "Filenames taken from a name or certificate_id column",
    ],
    faqs: [
      {
        question: "What if my list is longer than 500 rows?",
        answer:
          "The batch limit is 500 rows. A longer CSV is truncated to the first 500 and you are warned before export, so split the list into runs of 500 in your spreadsheet and export each run in turn.",
      },
      {
        question: "Should I export one combined PDF or separate files?",
        answer:
          "A combined PDF is easier to print or hand to a print shop. Separate files are easier to email individually — each one is named from a column you choose, such as the recipient name or certificate ID.",
      },
      {
        question: "Does a big batch take long?",
        answer:
          "No. The design and fonts are embedded once for the whole batch rather than per certificate, so a 500-row run finishes in about a second.",
      },
    ],
    spreadsheetSteps: {
      excel: [
        "Put one recipient per row, with a single header row at the top.",
        "File → Save As, then choose CSV UTF-8 (Comma delimited) so accented names survive.",
        "Only the active sheet is saved, so make sure the recipient list is the sheet you are on.",
      ],
      googleSheets: [
        "Keep the recipient list on one tab, with a single header row.",
        "File → Download → Comma-separated values (.csv).",
        "Formulas download as their calculated values, so a merged full_name column exports as finished text.",
      ],
    },
    relatedSlugs: [
      "certificate-generator-from-csv",
      "excel-to-certificate",
      "google-sheets-to-certificate",
    ],
  },
  {
    slug: "excel-to-certificate",
    title: "Excel to certificate",
    shortTitle: "Excel to certificate",
    metadataTitle: "Excel to Certificate",
    metadataDescription:
      "Turn an Excel spreadsheet into personalized certificate PDFs. Save the .xlsx as CSV, place your columns on a certificate design, and export the whole list.",
    kicker: "Excel to certificate PDFs",
    heroTitle: "Your Excel list, printed onto certificates.",
    heroBody:
      "If the names are already in Excel, the certificate work is nearly done. Save the workbook as a CSV, upload it, and place columns such as name, course, and date onto a certificate design — Batch, Please fills in every row and exports finished PDFs. No mail merge, no Word document, no add-ins.",
    imageSrc: "/starter-designs/certificate-modern.png",
    imageAlt: "Modern certificate design used as a Batch, Please starter template",
    audience: ["Excel-first admin teams", "Trainers keeping rosters in .xlsx", "Office coordinators"],
    painPoints: [
      "Word mail merge breaking every time the workbook changes",
      "Dates arriving as 45231 instead of a readable date",
      "Names with accents turning into question marks after export",
    ],
    csvColumns: ["first_name", "last_name", "course", "date_completed", "grade"],
    workflow: [
      "Tidy the sheet so row 1 is headers and every row below is one recipient.",
      "Save As → CSV UTF-8 (Comma delimited), which writes the sheet you are on.",
      "Upload that CSV, choose a certificate design, and place your columns.",
      "Preview a few real rows, then export the certificates as PDFs.",
    ],
    outputs: [
      "Certificate PDFs straight from an .xlsx list",
      "One combined PDF for printing",
      "Separate PDFs named from a column",
    ],
    faqs: [
      {
        question: "Can I upload an Excel file directly?",
        answer:
          "Not yet — the upload accepts .csv only. In Excel, use File → Save As and pick CSV UTF-8 (Comma delimited). The workbook itself is unchanged; you just get a .csv alongside it.",
      },
      {
        question: "Why do my dates look like numbers?",
        answer:
          "Excel stores dates as serial numbers and CSV keeps whatever is displayed. Format the date column the way you want it to read on the certificate before saving as CSV, or type the dates as plain text.",
      },
      {
        question: "Do accented or non-English names work?",
        answer:
          "Yes, as long as you save as CSV UTF-8 and pick a font that covers those characters. Before export, a preflight check flags any character the selected font cannot print instead of quietly rendering an empty box.",
      },
    ],
    spreadsheetSteps: {
      excel: [
        "Row 1 must be headers, with no title row or merged cells above it.",
        "Hidden columns and filtered-out rows are still written to the CSV — delete what you do not want.",
        "File → Save As → CSV UTF-8 (Comma delimited). Excel saves only the active sheet.",
      ],
      googleSheets: [
        "Working in Sheets instead? File → Download → Comma-separated values (.csv).",
        "See the Google Sheets to certificate page for the Sheets-specific details.",
      ],
    },
    relatedSlugs: [
      "google-sheets-to-certificate",
      "bulk-certificate-generator",
      "certificate-generator-from-csv",
    ],
  },
  {
    slug: "google-sheets-to-certificate",
    title: "Google Sheets to certificate",
    shortTitle: "Sheets to certificate",
    metadataTitle: "Google Sheets to Certificate",
    metadataDescription:
      "Turn a Google Sheet into personalized certificate PDFs. Download the sheet as CSV, place your columns on a certificate design, and export every row at once.",
    kicker: "Google Sheets to certificates",
    heroTitle: "From a shared sheet to finished certificates.",
    heroBody:
      "Attendance, sign-ups, and course rosters usually already live in a Google Sheet. Download that tab as a CSV, upload it, and place columns such as name, course, and completion date onto a certificate design. Every row becomes a certificate, without a script, an add-on, or granting access to your Drive.",
    imageSrc: "/starter-designs/certificate-modern.png",
    imageAlt: "Modern certificate design used with a Google Sheets roster",
    audience: ["Teams working in Google Workspace", "Google Forms organizers", "Community and club leads"],
    painPoints: [
      "Add-ons that want full access to your Drive",
      "Apps Script solutions nobody on the team can maintain",
      "Form responses that need cleaning before they are presentable",
    ],
    csvColumns: ["full_name", "course_name", "completion_date", "instructor", "email"],
    workflow: [
      "Open the tab holding your roster — the download exports the active tab only.",
      "File → Download → Comma-separated values (.csv).",
      "Upload the CSV, pick a certificate design, and place your columns on it.",
      "Preview real rows for text fit, then export the certificate PDFs.",
    ],
    outputs: [
      "Certificate PDFs from a Sheets roster",
      "Certificates from linked Google Forms responses",
      "One combined PDF or separate files",
    ],
    faqs: [
      {
        question: "Can Batch, Please connect to my Google Sheet directly?",
        answer:
          "No, and that is deliberate. There is no account, no Drive permission, and no live connection to break — you download a CSV and upload it, so nothing of yours stays connected to this tool.",
      },
      {
        question: "Which tab gets downloaded?",
        answer:
          "Only the tab you are viewing when you choose File → Download → CSV. If your roster is on a second tab, open that tab first.",
      },
      {
        question: "What happens to my formulas?",
        answer:
          "They download as their results, not the formulas themselves. A column that joins first and last names, or looks up a course title, arrives as finished text ready to place on the certificate.",
      },
    ],
    spreadsheetSteps: {
      excel: [
        "Working in Excel instead? File → Save As → CSV UTF-8 (Comma delimited).",
        "See the Excel to certificate page for the Excel-specific details.",
      ],
      googleSheets: [
        "Keep one header row at the top and one recipient per row below it.",
        "Delete trailing empty rows — Sheets can export them as blank rows.",
        "File → Download → Comma-separated values (.csv). Google Forms responses work the same way, via the linked response sheet.",
      ],
    },
    relatedSlugs: [
      "excel-to-certificate",
      "bulk-certificate-generator",
      "certificate-generator-from-csv",
    ],
  },
  {
    slug: "id-card-generator",
    title: "ID card generator",
    shortTitle: "ID card generator",
    metadataTitle: "ID Card Generator",
    metadataDescription:
      "Make membership, staff, student, and event ID-style cards from an Excel, Google Sheets, or CSV list. Print at CR80 card size or several per sheet.",
    kicker: "ID card generator",
    heroTitle: "Print a card for every person on the list.",
    heroBody:
      "Batch, Please builds ID-style cards — membership cards, staff cards, student cards, club cards, event passes — from a spreadsheet and one card design. Set a real physical card size such as CR80, place the details, and print them one per page or several to a sheet for cutting.",
    imageSrc: "/starter-designs/name-badge-classic.png",
    imageAlt: "Classic badge design set up at card proportions",
    audience: ["Membership organizations", "Small employers", "Clubs and community programs"],
    painPoints: [
      "Cards that print at the wrong size because the design was only ever pixels",
      "Laying out a sheet of cards by hand for the guillotine",
      "Artwork that looks fine on screen and blurry once printed",
    ],
    csvColumns: ["cardholder_name", "card_number", "membership_type", "valid_until", "department"],
    workflow: [
      "Export the cardholder list from Excel or Google Sheets as a CSV.",
      "Upload your card artwork and set the finished size — CR80 is 3.375 × 2.125 in.",
      "Place name, number, type, and expiry fields, and check the print-resolution warning.",
      "Export one card per page, or several per sheet with crop marks for trimming.",
    ],
    outputs: [
      "CR80-size card PDFs",
      "Sheets of cards with crop marks",
      "Custom card sizes in inches or mm",
    ],
    faqs: [
      {
        question: "What kinds of ID cards is this for?",
        answer:
          "Membership cards, staff and student cards, club cards, volunteer cards, and event passes. It is not for government-issued or official identity documents, and it must not be used to imitate one.",
      },
      {
        question: "Can each card have the person's photo?",
        answer:
          "No. Fields are text placed over one shared PNG or JPG design, so a per-person photo cannot be merged in. Everything else on the card can vary by row.",
      },
      {
        question: "Will the cards print at the right size?",
        answer:
          "Yes, because you set the finished size in inches or millimetres rather than pixels. Batch, Please also shows the effective print resolution for that size and warns you before export if the artwork would look blurry.",
      },
    ],
    spreadsheetSteps: {
      excel: [
        "One cardholder per row, with a single header row.",
        "Format card numbers as text so Excel does not strip leading zeros.",
        "File → Save As → CSV UTF-8 (Comma delimited).",
      ],
      googleSheets: [
        "One cardholder per row on a single tab.",
        "Format → Number → Plain text for card-number columns, so 00042 stays 00042.",
        "File → Download → Comma-separated values (.csv).",
      ],
    },
    relatedSlugs: [
      "id-cards-from-csv",
      "event-badge-generator",
      "event-badges-from-spreadsheet",
    ],
  },
  {
    slug: "event-badge-generator",
    title: "Event badge generator",
    shortTitle: "Badge generator",
    metadataTitle: "Event Badge Generator",
    metadataDescription:
      "Make printable event badges from an Excel, Google Sheets, or CSV attendee list. Choose a badge size, fit several per sheet, and reprint walk-ins in seconds.",
    kicker: "Event badge generator",
    heroTitle: "Badge production, from registration list to print run.",
    heroBody:
      "The badge itself is the easy part — printing four hundred of them, at the right size, in time for the doors opening, is not. Batch, Please takes your attendee export and produces sheets of badges sized to your holders, plus one-off reprints for the walk-ins who register at the desk.",
    imageSrc: "/starter-designs/name-badge-modern.png",
    imageAlt: "Modern name badge design used as a Batch, Please starter template",
    audience: ["Conference producers", "Trade show teams", "Registration desk staff"],
    painPoints: [
      "Badges that do not line up with the holders you already bought",
      "Wasting card stock on sheets with one badge per page",
      "No quick way to print a badge for someone who turns up unregistered",
    ],
    csvColumns: ["attendee_name", "organization", "ticket_type", "badge_number", "track"],
    workflow: [
      "Download the attendee list from your registration tool, Excel, or Google Sheets as CSV.",
      "Set the badge size to match your holders — 4 × 3 in and 3.5 × 2.25 in are common.",
      "Place name, organization, ticket type, and track fields on the badge design.",
      "Export several badges per sheet with crop marks, and print.",
    ],
    outputs: [
      "Badge sheets sized to your holders",
      "Crop marks for clean trimming",
      "Single-badge PDFs for walk-in reprints",
    ],
    faqs: [
      {
        question: "What badge size should I use?",
        answer:
          "Match the insert size of the holders you bought — 4 × 3 in and 3.5 × 2.25 in are the common ones. You set the finished size in inches or millimetres, so any holder size works.",
      },
      {
        question: "Can I print a badge for someone who registers at the door?",
        answer:
          "Yes. Make a CSV with just that person, or a handful of them, and export a single badge. A one-row export downloads as a plain PDF rather than a ZIP.",
      },
      {
        question: "Can different ticket types have different badge designs?",
        answer:
          "Run one batch per design. Filter the attendee list by ticket type in your spreadsheet, export each filtered list as its own CSV, and pair it with that design.",
      },
    ],
    spreadsheetSteps: {
      excel: [
        "One attendee per row, headers in row 1, no title row above them.",
        "Filtered-out rows still export, so delete the rows you do not want on badges.",
        "File → Save As → CSV UTF-8 (Comma delimited) to keep accented names intact.",
      ],
      googleSheets: [
        "Registration exports usually open in Sheets already — check that row 1 is headers.",
        "File → Download → Comma-separated values (.csv), which exports the active tab.",
        "For per-track badge runs, duplicate the tab and delete the other tracks before downloading.",
      ],
    },
    relatedSlugs: [
      "event-badges-from-spreadsheet",
      "id-card-generator",
      "workshop-passes-from-spreadsheet",
    ],
  },
];

export function getUseCasePage(slug: string) {
  return useCasePages.find((page) => page.slug === slug);
}

export function getUseCasePath(slug: string) {
  return `/use-cases/${slug}`;
}
