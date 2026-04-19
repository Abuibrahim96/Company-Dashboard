import Anthropic from "@anthropic-ai/sdk";

export const TOOLS: Anthropic.Tool[] = [
  // ── Operators ──────────────────────────────────────────────
  {
    name: "add_operator",
    description:
      "Add a new owner-operator to the system. Commission defaults to 12%.",
    input_schema: {
      type: "object" as const,
      properties: {
        full_name: { type: "string", description: "Operator's full name" },
        phone: { type: "string", description: "Phone number" },
        email: { type: "string", description: "Email address" },
        address: { type: "string", description: "Mailing address" },
        cdl_class: { type: "string", description: "CDL class (A, B, C)" },
        cdl_number: { type: "string", description: "CDL license number" },
        commission_rate: {
          type: "number",
          description: "Commission rate as decimal (default 0.12)",
        },
      },
      required: ["full_name"],
    },
  },
  {
    name: "update_operator",
    description: "Update an existing operator's information.",
    input_schema: {
      type: "object" as const,
      properties: {
        operator_id: { type: "string", description: "Operator UUID" },
        full_name: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        address: { type: "string" },
        cdl_class: { type: "string" },
        cdl_number: { type: "string" },
        commission_rate: { type: "number" },
        status: {
          type: "string",
          enum: ["active", "suspended", "inactive"],
        },
      },
      required: ["operator_id"],
    },
  },
  {
    name: "remove_operator",
    description:
      "Permanently remove an operator. This cascades to their trucks and documents.",
    input_schema: {
      type: "object" as const,
      properties: {
        operator_id: { type: "string", description: "Operator UUID" },
      },
      required: ["operator_id"],
    },
  },
  {
    name: "search_operators",
    description: "Search for operators by name or filter by status.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Name search (partial match)",
        },
        status: {
          type: "string",
          enum: ["active", "suspended", "inactive"],
        },
      },
      required: [],
    },
  },

  // ── Trucks ─────────────────────────────────────────────────
  {
    name: "add_truck",
    description: "Add a truck for an operator.",
    input_schema: {
      type: "object" as const,
      properties: {
        operator_id: { type: "string", description: "Owner operator UUID" },
        make: { type: "string", description: "Truck make (e.g. Freightliner)" },
        model: {
          type: "string",
          description: "Truck model (e.g. Cascadia)",
        },
        year: { type: "string", description: "Model year" },
        vin: { type: "string", description: "Vehicle identification number" },
        license_plate: { type: "string" },
        license_state: { type: "string" },
        color: { type: "string" },
      },
      required: ["operator_id", "make", "model"],
    },
  },
  {
    name: "update_truck",
    description: "Update a truck's information.",
    input_schema: {
      type: "object" as const,
      properties: {
        truck_id: { type: "string", description: "Truck UUID" },
        make: { type: "string" },
        model: { type: "string" },
        year: { type: "string" },
        vin: { type: "string" },
        license_plate: { type: "string" },
        license_state: { type: "string" },
        color: { type: "string" },
        status: {
          type: "string",
          enum: ["active", "out_of_service", "maintenance"],
        },
      },
      required: ["truck_id"],
    },
  },

  // ── Documents ──────────────────────────────────────────────
  {
    name: "add_document",
    description: "Add a compliance document for an operator or truck.",
    input_schema: {
      type: "object" as const,
      properties: {
        operator_id: { type: "string", description: "Operator UUID" },
        truck_id: { type: "string", description: "Truck UUID" },
        type: {
          type: "string",
          enum: [
            "cdl",
            "medical_card",
            "insurance",
            "registration",
            "drug_test",
            "annual_inspection",
            "w9",
            "operating_authority",
          ],
          description: "Document type",
        },
        document_number: { type: "string" },
        issued_date: {
          type: "string",
          description: "ISO date (YYYY-MM-DD)",
        },
        expiration_date: {
          type: "string",
          description: "ISO date (YYYY-MM-DD)",
        },
        notes: { type: "string" },
      },
      required: ["type", "expiration_date"],
    },
  },
  {
    name: "get_expiring_documents",
    description:
      "Get documents expiring within the given number of days (default 30).",
    input_schema: {
      type: "object" as const,
      properties: {
        days: {
          type: "number",
          description: "Number of days to look ahead (default 30)",
        },
      },
      required: [],
    },
  },

  // ── Clients ────────────────────────────────────────────────
  {
    name: "add_client",
    description: "Add a new client (shipper or broker).",
    input_schema: {
      type: "object" as const,
      properties: {
        company_name: { type: "string", description: "Company name" },
        type: {
          type: "string",
          enum: ["shipper", "broker"],
          description: "Client type",
        },
        contact_name: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        mc_number: { type: "string" },
        dot_number: { type: "string" },
        payment_terms: {
          type: "string",
          enum: [
            "net_30",
            "net_15",
            "net_7",
            "quick_pay",
            "factoring",
            "other",
          ],
        },
        notes: { type: "string" },
      },
      required: ["company_name", "type"],
    },
  },
  {
    name: "search_clients",
    description: "Search for clients by name or filter by type.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Company name search" },
        type: { type: "string", enum: ["shipper", "broker"] },
      },
      required: [],
    },
  },
  {
    name: "update_client",
    description: "Update a client's information.",
    input_schema: {
      type: "object" as const,
      properties: {
        client_id: { type: "string", description: "Client UUID" },
        company_name: { type: "string" },
        type: { type: "string", enum: ["shipper", "broker"] },
        contact_name: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        mc_number: { type: "string" },
        dot_number: { type: "string" },
        payment_terms: {
          type: "string",
          enum: [
            "net_30",
            "net_15",
            "net_7",
            "quick_pay",
            "factoring",
            "other",
          ],
        },
        notes: { type: "string" },
      },
      required: ["client_id"],
    },
  },

  // ── Loads ──────────────────────────────────────────────────
  {
    name: "add_load",
    description:
      "Book a new load. Automatically calculates elite_cut and operator_pay based on the operator's commission rate.",
    input_schema: {
      type: "object" as const,
      properties: {
        operator_id: { type: "string", description: "Operator UUID" },
        client_id: { type: "string", description: "Client UUID" },
        origin_city: { type: "string" },
        origin_state: { type: "string", description: "Two-letter state code" },
        destination_city: { type: "string" },
        destination_state: {
          type: "string",
          description: "Two-letter state code",
        },
        rate: { type: "number", description: "Load rate in dollars" },
        pickup_date: {
          type: "string",
          description: "ISO date (YYYY-MM-DD)",
        },
        delivery_date: {
          type: "string",
          description: "ISO date (YYYY-MM-DD)",
        },
        miles: { type: "number", description: "Estimated miles" },
        notes: { type: "string" },
      },
      required: [
        "operator_id",
        "client_id",
        "origin_city",
        "origin_state",
        "destination_city",
        "destination_state",
        "rate",
      ],
    },
  },
  {
    name: "update_load",
    description: "Update a load's information or status.",
    input_schema: {
      type: "object" as const,
      properties: {
        load_id: { type: "string", description: "Load UUID" },
        status: {
          type: "string",
          enum: ["booked", "in_transit", "delivered", "invoiced", "paid"],
        },
        rate: { type: "number" },
        pickup_date: { type: "string" },
        delivery_date: { type: "string" },
        miles: { type: "number" },
        notes: { type: "string" },
      },
      required: ["load_id"],
    },
  },
  {
    name: "search_loads",
    description: "Search loads by operator, client, or status.",
    input_schema: {
      type: "object" as const,
      properties: {
        operator_id: { type: "string" },
        client_id: { type: "string" },
        status: {
          type: "string",
          enum: ["booked", "in_transit", "delivered", "invoiced", "paid"],
        },
      },
      required: [],
    },
  },

  // ── Dashboard & Applications ───────────────────────────────
  {
    name: "get_dashboard_stats",
    description:
      "Get overview stats: total operators, trucks, active loads, monthly revenue, and compliance percentage.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_applications",
    description: "Get operator applications, optionally filtered by status.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["pending", "reviewed", "onboarded", "rejected"],
        },
      },
      required: [],
    },
  },
  {
    name: "onboard_application",
    description:
      "Convert an application into a full operator. Creates the operator record, optionally creates a truck if truck info was provided, and marks the application as onboarded.",
    input_schema: {
      type: "object" as const,
      properties: {
        application_id: { type: "string", description: "Application UUID" },
      },
      required: ["application_id"],
    },
  },
];
