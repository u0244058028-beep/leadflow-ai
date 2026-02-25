// Legg til i toppen av filen:
import Button from '@/components/Button'
import { useToast } from '@/components/Toast'
import ErrorMessage from '@/components/ErrorMessage'

// Inne i komponenten:
const toast = useToast()
const [error, setError] = useState<string | null>(null)

// Erstatt alert med toast:
toast.success('Lead scored 7/10!')
toast.error('Failed to score lead')

// Erstatt vanlige knapper:
<Button
  onClick={() => setShowForm(true)}
  variant="primary"
>
  + New Lead
</Button>

<Button
  onClick={() => rescoreLead(lead.id)}
  loading={scoringLead === lead.id}
  variant="secondary"
  size="sm"
>
  Get AI score
</Button>