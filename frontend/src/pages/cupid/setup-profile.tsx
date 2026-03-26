import { useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUpsertCupidProfile, useUploadCupidImage } from "@/lib/cupid/api";
import { Camera, ArrowRight, User as UserIcon, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(18, "Must be at least 18").max(100, "Must be under 100"),
  bio: z.string().min(10, "Tell us a bit more about yourself"),
  gender: z.enum(["female", "male", "nonbinary", "other"]),
  interestedIn: z.array(z.string()).min(1, "Select at least one preference"),
  photoUrl: z.string().url("Must be a valid image URL").optional().or(z.literal("")),
  location: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function CupidSetupProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { mutate, isPending } = useUpsertCupidProfile();
  const { mutate: uploadImage, isPending: isUploading } = useUploadCupidImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      age: 18,
      bio: "",
      gender: "female",
      interestedIn: ["male"],
      photoUrl: "",
      location: "",
    },
  });

  const photoUrlValue = form.watch("photoUrl");

  function onSubmit(data: ProfileFormValues) {
    mutate(data, {
      onSuccess: () => {
        toast({ title: "Profile created!", description: "Welcome to Cupid." });
        setLocation("/cupid");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Failed to create profile", variant: "destructive" });
      }
    });
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadImage(file, {
      onSuccess: ({ url }) => {
        form.setValue("photoUrl", url);
        toast({ title: "Success", description: "Profile picture uploaded." });
      },
      onError: (err: any) => {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      },
    });
  };

  return (
    <div className="flex flex-col max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-foreground">💘 Create Cupid Profile</h1>
          <p className="text-muted-foreground mt-2 font-medium">Show your best self to the world</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 flex-1 flex flex-col">
          
          {/* Photo Upload Area */}
          <div className="flex flex-col items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-40 h-40 rounded-[2rem] overflow-hidden bg-primary/10 border-4 border-card shadow-xl group cursor-pointer"
            >
              {photoUrlValue ? (
                <img src={photoUrlValue} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-primary/40">
                  <UserIcon className="w-16 h-16 mb-2" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 mb-1" />
                    <span className="text-xs font-semibold">Upload Photo</span>
                  </>
                )}
              </div>
            </div>
            <div className="w-full max-w-xs text-center">
              <p className="text-sm text-muted-foreground">Click the frame to upload a profile picture</p>
              {form.formState.errors.photoUrl && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.photoUrl.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-[2rem] shadow-sm border border-white/5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 ml-1">First Name</label>
              <Input 
                placeholder="E.g., Sarah" 
                className="rounded-xl h-12 bg-background border-white/10"
                {...form.register("name")} 
              />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 ml-1">Age</label>
              <Input 
                type="number" 
                className="rounded-xl h-12 bg-background border-white/10"
                {...form.register("age")} 
              />
              {form.formState.errors.age && <p className="text-xs text-destructive">{form.formState.errors.age.message}</p>}
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-foreground/80 ml-1">Location</label>
              <Input 
                placeholder="E.g., New York, NY" 
                className="rounded-xl h-12 bg-background border-white/10"
                {...form.register("location")} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 ml-1">I am a...</label>
              <select 
                className="w-full h-12 rounded-xl border border-white/10 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                {...form.register("gender")}
              >
                <option value="female">Woman</option>
                <option value="male">Man</option>
                <option value="nonbinary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 ml-1">Interested in...</label>
              <select 
                className="w-full h-12 rounded-xl border border-white/10 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                onChange={(e) => form.setValue("interestedIn", [e.target.value])}
                defaultValue={form.watch("interestedIn")?.[0] || "male"}
              >
                <option value="male">Men</option>
                <option value="female">Women</option>
                <option value="nonbinary">Everyone</option>
              </select>
              {form.formState.errors.interestedIn && <p className="text-xs text-destructive">{form.formState.errors.interestedIn.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-foreground/80 ml-1">Bio</label>
              <Textarea 
                placeholder="A little bit about yourself..." 
                className="min-h-[100px] rounded-xl bg-background border-white/10 resize-none"
                {...form.register("bio")} 
              />
              {form.formState.errors.bio && <p className="text-xs text-destructive">{form.formState.errors.bio.message}</p>}
            </div>
          </div>

          <div className="mt-auto pt-8 pb-4">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full rounded-full h-14 text-lg font-bold shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 text-white"
              disabled={isPending}
            >
              {isPending ? "Creating..." : "Start Swiping"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
