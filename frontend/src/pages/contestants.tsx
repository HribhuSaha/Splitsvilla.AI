import { useState } from "react";
import { useListContestants, useCreateContestant, useDeleteContestant, CreateContestantBodyGender } from "@/lib/api-client-react/src/index";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, UserMinus, Star, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { motion } from "framer-motion";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  age: z.coerce.number().min(18).max(50),
  hometown: z.string().min(2),
  bio: z.string().min(10),
  zodiacSign: z.string().min(3),
  personality: z.string().min(3),
  interests: z.string().min(3),
  gender: z.enum(["male", "female", "other"]),
});

export default function Contestants() {
  const { data: contestants = [], isLoading } = useListContestants();
  const createMutation = useCreateContestant();
  const deleteMutation = useDeleteContestant();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", age: 22, hometown: "", bio: "", zodiacSign: "", personality: "", interests: "", gender: "male"
    }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
        setIsDialogOpen(false);
        form.reset();
        toast({ title: "Contestant Added", description: "They have entered the villa." });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if(confirm("Are you sure you want to remove this contestant entirely?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
          toast({ title: "Removed", description: "Contestant removed from records." });
        }
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-serif text-white">The Singles</h1>
          <p className="text-muted-foreground mt-1">Meet the beautiful people looking for love.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20 border border-primary/50">
              <Plus className="w-4 h-4 mr-2" /> Add Contestant
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-primary/30 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif text-glow-primary">New Arrival</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} className="bg-background/50 border-white/10" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem><FormLabel>Age</FormLabel><FormControl><Input type="number" {...field} className="bg-background/50 border-white/10" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="hometown" render={({ field }) => (
                    <FormItem><FormLabel>Hometown</FormLabel><FormControl><Input {...field} className="bg-background/50 border-white/10" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="zodiacSign" render={({ field }) => (
                    <FormItem><FormLabel>Zodiac Sign</FormLabel><FormControl><Input {...field} placeholder="e.g. Leo" className="bg-background/50 border-white/10" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 border-white/10"><SelectValue placeholder="Select gender" /></SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-panel">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="personality" render={({ field }) => (
                  <FormItem><FormLabel>Personality Traits (comma separated)</FormLabel><FormControl><Input {...field} placeholder="Outgoing, romantic, adventurous" className="bg-background/50 border-white/10" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="interests" render={({ field }) => (
                  <FormItem><FormLabel>Interests (comma separated)</FormLabel><FormControl><Input {...field} placeholder="Fitness, traveling, reading" className="bg-background/50 border-white/10" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="bio" render={({ field }) => (
                  <FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea {...field} className="bg-background/50 border-white/10 resize-none h-24" /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90">
                    {createMutation.isPending ? "Adding..." : "Add to Villa"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-96 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {contestants.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group"
            >
              <Card className="overflow-hidden glass-panel border-white/5 relative hover:border-primary/50 transition-colors duration-500 h-full flex flex-col">
                <div className="h-48 relative overflow-hidden bg-gradient-to-br from-black/40 to-black/80">
                  <img 
                    src={`${import.meta.env.BASE_URL}images/contestant-placeholder-${(i % 2) + 1}.png`} 
                    alt={c.name}
                    className="w-full h-full object-cover opacity-70 mix-blend-overlay group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                  
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-full border backdrop-blur-md
                      ${c.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                        c.status === 'dumped' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                        'bg-accent/20 text-accent border-accent/30'}`}>
                      {c.status}
                    </span>
                    {c.currentSplitId && (
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-md flex items-center gap-1">
                        <Heart className="w-3 h-3" /> Coupled
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-white group-hover:text-glow-primary transition-all">{c.name}, {c.age}</h3>
                      <p className="text-sm text-secondary">{c.hometown}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-1" onClick={() => handleDelete(c.id)}>
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 italic">"{c.bio}"</p>
                  
                  <div className="mt-auto space-y-3">
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1 flex items-center gap-1"><Star className="w-3 h-3"/> Zodiac</p>
                      <p className="text-sm text-white/90">{c.zodiacSign}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Traits</p>
                      <div className="flex flex-wrap gap-1">
                        {(c.personality || "").split(',').filter(Boolean).map((p, idx) => (
                           <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/70">
                             {p.trim()}
                           </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
          {contestants.length === 0 && !isLoading && (
            <div className="col-span-full py-12 text-center text-muted-foreground glass-panel rounded-xl">
              No contestants in the villa yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
