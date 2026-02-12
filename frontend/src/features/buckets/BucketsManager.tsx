import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ShieldCheck, Wallet, Baby } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { type Bucket } from '../../hooks/useBuckets';

interface BucketsManagerProps {
  buckets: Bucket[];
  onSave: (buckets: Bucket[]) => void;
}

export const BucketsManager: React.FC<BucketsManagerProps> = ({ buckets, onSave }) => {
  const [newBucket, setNewBucket] = useState('');

  const addBucket = () => {
    if (newBucket && !buckets.find(b => b.name === newBucket)) {
      onSave([...buckets, { name: newBucket }]);
      setNewBucket('');
    }
  };

  const deleteBucket = (name: string) => {
    if (name === 'Main') return;
    onSave(buckets.filter(b => b.name !== name));
  };

  const getIcon = (name: string) => {
    if (name === 'Main') return <Wallet className="w-5 h-5 text-emerald-500" />;
    if (name === 'Kindergeld') return <Baby className="w-5 h-5 text-blue-500" />;
    return <ShieldCheck className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Logical Buckets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage how your money is logically separated regardless of physical bank accounts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add New Bucket</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              placeholder="Bucket Name (e.g. Travel, Emergency)" 
              value={newBucket}
              onChange={(e) => setNewBucket(e.target.value)}
            />
            <Button onClick={addBucket}>
              <Plus className="w-4 h-4 mr-2" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {buckets.map((bucket) => (
          <Card key={bucket.name}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  {getIcon(bucket.name)}
                </div>
                <div>
                  <p className="font-semibold">{bucket.name}</p>
                  <p className="text-xs text-muted-foreground">{bucket.description || 'Logical separation of funds'}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive"
                disabled={bucket.name === 'Main'}
                onClick={() => deleteBucket(bucket.name)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};