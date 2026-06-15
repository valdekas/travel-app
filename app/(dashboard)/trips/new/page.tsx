import { CreateTripForm } from '@/components/trips/create-trip-form'

export default function NewTripPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Trip</h1>
        <p className="text-muted-foreground mt-1">Plan your next adventure from start to finish</p>
      </div>
      <CreateTripForm />
    </div>
  )
}
