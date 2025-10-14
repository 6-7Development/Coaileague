import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Building2 } from "lucide-react";

export function TaxSelectionStep({ application, onNext }: any) {
  const [selected, setSelected] = useState<'w4_employee' | 'w9_contractor' | null>(
    application?.taxClassification || null
  );

  const handleNext = () => {
    if (selected) {
      onNext({ taxClassification: selected });
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Tax Classification</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Select your employment classification. This determines your tax forms and employment type.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card 
          className={`cursor-pointer transition-all hover-elevate ${
            selected === 'w4_employee' ? 'border-primary ring-2 ring-primary' : ''
          }`}
          onClick={() => setSelected('w4_employee')}
          data-testid="card-w4-employee"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <FileText className="h-8 w-8 text-primary" />
              {selected === 'w4_employee' && <Badge>Selected</Badge>}
            </div>
            <CardTitle>W-4 Employee</CardTitle>
            <CardDescription>Traditional employment with benefits</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Receive Form W-2 at year-end</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Taxes withheld from paycheck</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Eligible for benefits (if offered)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Employer pays part of taxes</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover-elevate ${
            selected === 'w9_contractor' ? 'border-primary ring-2 ring-primary' : ''
          }`}
          onClick={() => setSelected('w9_contractor')}
          data-testid="card-w9-contractor"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <Building2 className="h-8 w-8 text-primary" />
              {selected === 'w9_contractor' && <Badge>Selected</Badge>}
            </div>
            <CardTitle>W-9 Contractor</CardTitle>
            <CardDescription>Independent contractor status</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Receive Form 1099-NEC at year-end</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Responsible for own taxes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Greater flexibility and control</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>No benefits from employer</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-6">
        <Button 
          onClick={handleNext} 
          disabled={!selected}
          data-testid="button-next-tax-selection"
        >
          Continue to Work Availability
        </Button>
      </div>
    </div>
  );
}
