import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function WorkAvailabilityStep({ application, onNext }: any) {
  const form = useForm({
    defaultValues: {
      availableMonday: application?.availableMonday ?? true,
      availableTuesday: application?.availableTuesday ?? true,
      availableWednesday: application?.availableWednesday ?? true,
      availableThursday: application?.availableThursday ?? true,
      availableFriday: application?.availableFriday ?? true,
      availableSaturday: application?.availableSaturday ?? false,
      availableSunday: application?.availableSunday ?? false,
      preferredShiftTime: application?.preferredShiftTime || "morning",
      maxHoursPerWeek: application?.maxHoursPerWeek || 40,
      availabilityNotes: application?.availabilityNotes || "",
    },
  });

  const onSubmit = (data: any) => {
    onNext(data);
  };

  const days = [
    { name: "Monday", field: "availableMonday" },
    { name: "Tuesday", field: "availableTuesday" },
    { name: "Wednesday", field: "availableWednesday" },
    { name: "Thursday", field: "availableThursday" },
    { name: "Friday", field: "availableFriday" },
    { name: "Saturday", field: "availableSaturday" },
    { name: "Sunday", field: "availableSunday" },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Work Availability</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Help us schedule you effectively by sharing your availability preferences.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <FormLabel className="text-base">Available Days</FormLabel>
            <p className="text-sm text-muted-foreground mb-3">Select the days you're available to work</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {days.map((day) => (
                <FormField
                  key={day.field}
                  control={form.control}
                  name={day.field as any}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid={`checkbox-${day.field}`}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        {day.name}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          <FormField
            control={form.control}
            name="preferredShiftTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Shift Time</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-shift-time">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="morning">Morning (6 AM - 12 PM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12 PM - 6 PM)</SelectItem>
                    <SelectItem value="evening">Evening (6 PM - 12 AM)</SelectItem>
                    <SelectItem value="night">Night (12 AM - 6 AM)</SelectItem>
                    <SelectItem value="any">Any Time</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxHoursPerWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Hours Per Week</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    data-testid="input-max-hours"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="availabilityNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any scheduling constraints or preferences..." 
                    {...field} 
                    data-testid="textarea-availability-notes"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-4">
            <Button type="submit" data-testid="button-next-availability">
              Continue to Documents
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
