import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generateLoadNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `ELT-${year}-${rand}`;
}

export async function handleToolCall(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  try {
    switch (name) {
      // ── Operators ────────────────────────────────────────
      case "add_operator": {
        const { full_name, phone, email, address, cdl_class, cdl_number, commission_rate } = input as {
          full_name: string;
          phone?: string;
          email?: string;
          address?: string;
          cdl_class?: string;
          cdl_number?: string;
          commission_rate?: number;
        };
        const { data, error } = await getSupabase()
          .from("operators")
          .insert({
            full_name,
            phone: phone || null,
            email: email || null,
            address: address || null,
            cdl_class: cdl_class || null,
            cdl_number: cdl_number || null,
            commission_rate: commission_rate ?? 0.12,
            status: "active",
          })
          .select()
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, operator: data });
      }

      case "update_operator": {
        const { operator_id, ...updates } = input as {
          operator_id: string;
          [key: string]: unknown;
        };
        const { data, error } = await getSupabase()
          .from("operators")
          .update(updates)
          .eq("id", operator_id)
          .select()
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, operator: data });
      }

      case "remove_operator": {
        const { operator_id } = input as { operator_id: string };
        const { error } = await getSupabase()
          .from("operators")
          .delete()
          .eq("id", operator_id);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, message: "Operator removed" });
      }

      case "search_operators": {
        const { query, status } = input as {
          query?: string;
          status?: string;
        };
        let q = getSupabase().from("operators").select("*");
        if (query) q = q.ilike("full_name", `%${query}%`);
        if (status) q = q.eq("status", status);
        const { data, error } = await q.order("full_name");
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ operators: data, count: data?.length ?? 0 });
      }

      // ── Trucks ───────────────────────────────────────────
      case "add_truck": {
        const { operator_id, make, model, year, vin, license_plate, license_state, color } = input as {
          operator_id: string;
          make: string;
          model: string;
          year?: string;
          vin?: string;
          license_plate?: string;
          license_state?: string;
          color?: string;
        };
        const { data, error } = await getSupabase()
          .from("trucks")
          .insert({
            operator_id,
            make,
            model,
            year: year || null,
            vin: vin || null,
            license_plate: license_plate || null,
            license_state: license_state || null,
            color: color || null,
          })
          .select()
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, truck: data });
      }

      case "update_truck": {
        const { truck_id, ...updates } = input as {
          truck_id: string;
          [key: string]: unknown;
        };
        const { data, error } = await getSupabase()
          .from("trucks")
          .update(updates)
          .eq("id", truck_id)
          .select()
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, truck: data });
      }

      // ── Documents ────────────────────────────────────────
      case "add_document": {
        const {
          operator_id,
          truck_id,
          type,
          document_number,
          issued_date,
          expiration_date,
          notes,
        } = input as {
          operator_id?: string;
          truck_id?: string;
          type: string;
          document_number?: string;
          issued_date?: string;
          expiration_date: string;
          notes?: string;
        };
        const { data, error } = await getSupabase()
          .from("documents")
          .insert({
            operator_id: operator_id || null,
            truck_id: truck_id || null,
            type,
            document_number: document_number || null,
            issued_date: issued_date || null,
            expiration_date,
            notes: notes || null,
          })
          .select()
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, document: data });
      }

      case "get_expiring_documents": {
        const { days = 30 } = input as { days?: number };
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + days);
        const cutoffStr = cutoff.toISOString().split("T")[0];

        const { data, error } = await getSupabase()
          .from("documents")
          .select("*, operators(full_name), trucks(make, model, vin)")
          .lte("expiration_date", cutoffStr)
          .order("expiration_date");
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ documents: data, count: data?.length ?? 0 });
      }

      // ── Clients ──────────────────────────────────────────
      case "add_client": {
        const {
          company_name,
          type,
          contact_name,
          phone,
          email,
          mc_number,
          dot_number,
          payment_terms,
          notes,
        } = input as {
          company_name: string;
          type: string;
          contact_name?: string;
          phone?: string;
          email?: string;
          mc_number?: string;
          dot_number?: string;
          payment_terms?: string;
          notes?: string;
        };
        const { data, error } = await getSupabase()
          .from("clients")
          .insert({
            company_name,
            type,
            contact_name: contact_name || null,
            phone: phone || null,
            email: email || null,
            mc_number: mc_number || null,
            dot_number: dot_number || null,
            payment_terms: payment_terms || null,
            notes: notes || null,
          })
          .select()
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, client: data });
      }

      case "search_clients": {
        const { query, type } = input as { query?: string; type?: string };
        let q = getSupabase().from("clients").select("*");
        if (query) q = q.ilike("company_name", `%${query}%`);
        if (type) q = q.eq("type", type);
        const { data, error } = await q.order("company_name");
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ clients: data, count: data?.length ?? 0 });
      }

      case "update_client": {
        const { client_id, ...updates } = input as {
          client_id: string;
          [key: string]: unknown;
        };
        const { data, error } = await getSupabase()
          .from("clients")
          .update(updates)
          .eq("id", client_id)
          .select()
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, client: data });
      }

      // ── Loads ────────────────────────────────────────────
      case "add_load": {
        const {
          operator_id,
          client_id,
          origin_city,
          origin_state,
          destination_city,
          destination_state,
          rate,
          pickup_date,
          delivery_date,
          miles,
          notes,
        } = input as {
          operator_id: string;
          client_id: string;
          origin_city: string;
          origin_state: string;
          destination_city: string;
          destination_state: string;
          rate: number;
          pickup_date?: string;
          delivery_date?: string;
          miles?: number;
          notes?: string;
        };

        // Fetch operator's commission rate
        const { data: operator, error: opError } = await getSupabase()
          .from("operators")
          .select("commission_rate")
          .eq("id", operator_id)
          .single();
        if (opError)
          return JSON.stringify({ error: `Operator not found: ${opError.message}` });

        const commissionRate = Number(operator.commission_rate);
        const eliteCut = Math.round(rate * commissionRate * 100) / 100;
        const operatorPay = Math.round((rate - eliteCut) * 100) / 100;
        const loadNumber = generateLoadNumber();

        const { data, error } = await getSupabase()
          .from("loads")
          .insert({
            load_number: loadNumber,
            operator_id,
            client_id,
            origin_city,
            origin_state,
            destination_city,
            destination_state,
            rate,
            pickup_date: pickup_date || null,
            delivery_date: delivery_date || null,
            miles: miles || null,
            commission_rate: commissionRate,
            elite_cut: eliteCut,
            operator_pay: operatorPay,
            notes: notes || null,
          })
          .select()
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, load: data });
      }

      case "update_load": {
        const { load_id, ...updates } = input as {
          load_id: string;
          [key: string]: unknown;
        };

        // If rate is being updated, recalculate financials
        if (updates.rate) {
          const { data: existingLoad } = await getSupabase()
            .from("loads")
            .select("operator_id, commission_rate")
            .eq("id", load_id)
            .single();
          if (existingLoad) {
            const newRate = Number(updates.rate);
            const commRate = Number(existingLoad.commission_rate);
            updates.elite_cut = Math.round(newRate * commRate * 100) / 100;
            updates.operator_pay =
              Math.round((newRate - (updates.elite_cut as number)) * 100) / 100;
          }
        }

        const { data, error } = await getSupabase()
          .from("loads")
          .update(updates)
          .eq("id", load_id)
          .select()
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, load: data });
      }

      case "search_loads": {
        const { operator_id, client_id, status } = input as {
          operator_id?: string;
          client_id?: string;
          status?: string;
        };
        let q = getSupabase()
          .from("loads")
          .select("*, operators(full_name), clients(company_name)");
        if (operator_id) q = q.eq("operator_id", operator_id);
        if (client_id) q = q.eq("client_id", client_id);
        if (status) q = q.eq("status", status);
        const { data, error } = await q.order("created_at", {
          ascending: false,
        });
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ loads: data, count: data?.length ?? 0 });
      }

      // ── Dashboard ────────────────────────────────────────
      case "get_dashboard_stats": {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        const cutoff30 = new Date();
        cutoff30.setDate(cutoff30.getDate() + 30);
        const cutoff30Str = cutoff30.toISOString().split("T")[0];

        const db = getSupabase();
        const [operatorsRes, trucksRes, activeLoadsRes, monthlyRevenueRes, totalDocsRes, expiringDocsRes] =
          await Promise.all([
            db
              .from("operators")
              .select("id", { count: "exact", head: true })
              .eq("status", "active"),
            db
              .from("trucks")
              .select("id", { count: "exact", head: true })
              .eq("status", "active"),
            db
              .from("loads")
              .select("id", { count: "exact", head: true })
              .in("status", ["booked", "in_transit"]),
            db
              .from("loads")
              .select("elite_cut")
              .gte("created_at", monthStart),
            db
              .from("documents")
              .select("id", { count: "exact", head: true }),
            db
              .from("documents")
              .select("id", { count: "exact", head: true })
              .lte("expiration_date", cutoff30Str),
          ]);

        const monthlyRevenue = (monthlyRevenueRes.data || []).reduce(
          (sum: number, row: { elite_cut: number | null }) =>
            sum + (Number(row.elite_cut) || 0),
          0
        );
        const totalDocs = totalDocsRes.count ?? 0;
        const expiringDocs = expiringDocsRes.count ?? 0;
        const compliancePercentage =
          totalDocs > 0
            ? Math.round(((totalDocs - expiringDocs) / totalDocs) * 100)
            : 100;

        return JSON.stringify({
          active_operators: operatorsRes.count ?? 0,
          active_trucks: trucksRes.count ?? 0,
          active_loads: activeLoadsRes.count ?? 0,
          monthly_revenue: monthlyRevenue,
          compliance_percentage: compliancePercentage,
          expiring_documents: expiringDocs,
        });
      }

      // ── Applications ─────────────────────────────────────
      case "get_applications": {
        const { status } = input as { status?: string };
        let q = getSupabase().from("applications").select("*");
        if (status) q = q.eq("status", status);
        const { data, error } = await q.order("created_at", {
          ascending: false,
        });
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({
          applications: data,
          count: data?.length ?? 0,
        });
      }

      case "onboard_application": {
        const { application_id } = input as { application_id: string };

        // 1. Fetch the application
        const { data: app, error: appError } = await getSupabase()
          .from("applications")
          .select("*")
          .eq("id", application_id)
          .single();
        if (appError)
          return JSON.stringify({
            error: `Application not found: ${appError.message}`,
          });
        if (app.status === "onboarded")
          return JSON.stringify({
            error: "This application has already been onboarded",
          });

        // 2. Create operator
        const { data: operator, error: opError } = await getSupabase()
          .from("operators")
          .insert({
            full_name: app.full_name,
            phone: app.phone || null,
            email: app.email || null,
            cdl_class: app.cdl_class || null,
            commission_rate: 0.12,
            status: "active",
            onboarded_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (opError)
          return JSON.stringify({
            error: `Failed to create operator: ${opError.message}`,
          });

        // 3. Optionally create truck if truck info exists
        let truck = null;
        if (app.truck_make && app.truck_model) {
          const { data: truckData, error: truckError } = await getSupabase()
            .from("trucks")
            .insert({
              operator_id: operator.id,
              make: app.truck_make,
              model: app.truck_model,
              year: app.truck_year || null,
            })
            .select()
            .single();
          if (!truckError) truck = truckData;
        }

        // 4. Update application status
        await getSupabase()
          .from("applications")
          .update({ status: "onboarded" })
          .eq("id", application_id);

        return JSON.stringify({
          success: true,
          message: `Onboarded ${app.full_name} as a new operator`,
          operator,
          truck,
        });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return JSON.stringify({ error: message });
  }
}
