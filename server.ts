import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Supabase Admin
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || 'https://wycsvsaktfmjewihtscz.supabase.co').trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  console.log('Supabase Admin Init Check:', {
    urlFound: !!supabaseUrl,
    serviceKeyFound: !!serviceRoleKey,
    url: supabaseUrl
  });

  const supabaseAdmin = (supabaseUrl && serviceRoleKey) 
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    : null;

  // API Route for Bulk User Creation
  app.post("/api/admin/bulk-register", async (req, res) => {
    if (!supabaseAdmin) {
      return res.status(500).json({ 
        error: "Supabase Admin client not initialized. Check your SUPABASE_SERVICE_ROLE_KEY." 
      });
    }

    const { users } = req.body;
    if (!Array.isArray(users)) {
      return res.status(400).json({ error: "Users must be an array." });
    }

    const results = {
      success: [] as any[],
      failed: [] as any[]
    };

    for (const user of users) {
      try {
        // 1. Create Auth User
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password || 'simujian2026', // Default password if not provided
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
            role: user.role || 'siswa'
          }
        });

        if (authError) {
          // If user already exists, we might want to just update the profile
          if (authError.message.includes('already registered')) {
            // Find existing user to get ID
            const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = existingUsers?.users.find(u => u.email === user.email);
            
            if (existingUser) {
              // Trigger usually handles profile creation, but we update extra fields
              const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({
                  full_name: user.full_name,
                  role: user.role,
                  nisn: user.nisn,
                  class_id: user.class_id,
                  major_id: user.major_id
                })
                .eq('id', existingUser.id);

              if (profileError) throw profileError;
              results.success.push({ email: user.email, status: 'updated' });
              continue;
            }
          }
          throw authError;
        }

        // 2. Update Profile with extra data (NISN, Class, Major)
        // Note: Trigger on_auth_user_created might already have created the profile
        // but we need to update it with the specific fields from Excel
        if (authUser.user) {
          // Wait a bit for trigger
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
              full_name: user.full_name,
              role: user.role,
              nisn: user.nisn,
              class_id: user.class_id,
              major_id: user.major_id
            })
            .eq('id', authUser.user.id);

          if (profileError) throw profileError;
        }

        results.success.push({ email: user.email, status: 'created' });
      } catch (err: any) {
        results.failed.push({ email: user.email, error: err.message });
      }
    }

    res.json(results);
  });

  // API Route for User Deletion
  app.delete("/api/admin/delete-user/:id", async (req, res) => {
    if (!supabaseAdmin) {
      return res.status(500).json({ 
        error: "Supabase Admin client not initialized." 
      });
    }

    const { id } = req.params;
    
    try {
      // Deleting from Auth will automatically delete from Profiles if CASCADE is set
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) throw error;
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      adminReady: !!supabaseAdmin,
      config: {
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey
      }
    });
  });

  // Global Error Handler for API
  app.use("/api", (err: any, req: any, res: any, next: any) => {
    console.error("API Error:", err);
    res.status(500).json({ 
      error: "Sistem mengalami gangguan teknis.",
      details: err.message 
    });
  });

  // Handle missing API routes with JSON
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL: Server failed to start:", err);
});
