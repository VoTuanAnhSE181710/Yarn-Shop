import { useAuth } from "../context/AuthContext";
import { Mail, Phone, Calendar } from "lucide-react";

export function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="mb-8">My Profile</h1>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-8 flex items-center gap-6">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-full border-4 border-card shadow-lg"
            />
            <div>
              <h2 className="mb-1">{user.name}</h2>
              <p className="text-muted-foreground">CozyStitch Member</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div>
              <h3 className="mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">May 2026</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <button className="bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
