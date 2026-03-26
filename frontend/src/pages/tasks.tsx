import { useState } from "react";
import { useListTasks, useCreateTask, useUpdateTask, useDeleteTask, CreateTaskBodyTaskType, UpdateTaskBodyStatus } from "@/lib/api-client-react/src/index";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Swords, Trash2, Calendar, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";

const taskSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  taskType: z.enum(["physical", "mental", "creative", "romantic", "elimination"]),
});

export default function Tasks() {
  const { data: tasks = [], isLoading } = useListTasks();
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: "", description: "", taskType: "physical" }
  });

  const onSubmit = (data: z.infer<typeof taskSchema>) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        setIsDialogOpen(false);
        form.reset();
        toast({ title: "Task Created", description: "Let the games begin." });
      }
    });
  };

  const handleUpdateStatus = (id: number, status: UpdateTaskBodyStatus) => {
    updateMutation.mutate({ id, data: { status } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tasks"] })
    });
  };

  const handleDelete = (id: number) => {
    if(confirm("Cancel this task?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tasks"] })
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'physical': return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
      case 'mental': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case 'romantic': return 'text-primary border-primary/30 bg-primary/10';
      case 'elimination': return 'text-destructive border-destructive/30 bg-destructive/10';
      default: return 'text-green-400 border-green-400/30 bg-green-400/10';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-serif text-white">Challenges</h1>
          <p className="text-muted-foreground mt-1">Tests of strength, mind, and connection.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-white text-black hover:bg-white/90 font-bold rounded-xl shadow-lg shadow-white/10">
              <Swords className="w-4 h-4 mr-2" /> New Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-white/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">Design Challenge</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Task Title</FormLabel><FormControl><Input {...field} className="bg-background/50 border-white/10" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="taskType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="bg-background/50 border-white/10"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent className="glass-panel">
                        <SelectItem value="physical">Physical</SelectItem>
                        <SelectItem value="mental">Mental</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="romantic">Romantic</SelectItem>
                        <SelectItem value="elimination">Elimination</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} className="bg-background/50 border-white/10 h-24" /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending} className="bg-white text-black hover:bg-white/90">
                    Schedule Task
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {['upcoming', 'ongoing', 'completed'].map(status => (
          <div key={status} className="space-y-4">
            <h2 className="text-xl font-bold uppercase tracking-widest text-white/50 border-b border-white/10 pb-2 flex items-center gap-2">
              {status === 'upcoming' && <Calendar className="w-5 h-5"/>}
              {status === 'ongoing' && <Target className="w-5 h-5 text-secondary animate-pulse"/>}
              {status === 'completed' && <Trophy className="w-5 h-5 text-accent"/>}
              {status}
            </h2>
            
            <div className="space-y-4">
              {tasks.filter(t => t.status === status).map(task => (
                <Card key={task.id} className="p-5 glass-panel border-white/5 hover:border-white/20 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getTypeColor(task.taskType)}`}>
                      {task.taskType}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} className="h-6 w-6 text-muted-foreground hover:text-destructive -mt-2 -mr-2">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <h3 className="text-lg font-serif font-bold text-white mb-2 leading-tight">{task.title}</h3>
                  <p className="text-sm text-white/60 mb-4 line-clamp-3">{task.description}</p>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <span className="text-xs text-white/40">{format(new Date(task.createdAt), 'MMM d')}</span>
                    
                    {status === 'upcoming' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(task.id, 'ongoing')} className="bg-secondary/20 text-secondary hover:bg-secondary/30 h-8">
                        Start Task
                      </Button>
                    )}
                    {status === 'ongoing' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(task.id, 'completed')} className="bg-accent/20 text-accent hover:bg-accent/30 h-8">
                        Complete
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
              {tasks.filter(t => t.status === status).length === 0 && (
                <div className="p-8 text-center text-white/30 border border-dashed border-white/10 rounded-xl text-sm">
                  No {status} tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
