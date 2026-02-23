// I details-seksjonen, legg til etter AI Score:
{lead.potential_value && (
  <div className="mt-4 p-3 rounded-lg bg-gray-50">
    <p className="text-sm font-medium text-gray-700 mb-1">Estimated Value</p>
    <div className="flex items-center gap-3">
      <span className="text-2xl font-bold text-green-600">
        ${lead.potential_value.toLocaleString()}
      </span>
      <p className="text-xs text-gray-600">
        {lead.status === 'converted' ? '💰 Won deal' : '📊 Pipeline value'}
      </p>
    </div>
  </div>
)}