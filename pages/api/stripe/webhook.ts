case 'checkout.session.completed': {
  const session = event.data.object;
  const userId = session.metadata?.userId;
  const subscriptionId = session.subscription;
  const customerId = session.customer;

  console.log('💰 checkout.session.completed:', { 
    userId, 
    subscriptionId, 
    customerId,
    metadata: session.metadata 
  });

  if (!userId) {
    console.log('❌ Ingen userId i metadata');
    return res.status(400).json({ error: 'Ingen userId i metadata' });
  }

  // Test om brukeren finnes i databasen FØR oppdatering
  const { data: existingUser, error: findError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('id', userId)
    .single();

  console.log('👤 Eksisterende bruker:', existingUser);

  // Fortsett med oppdatering...
}