// Disabled auth actions for spec-centric system
export async function signUp() {
  return { error: 'Authentication disabled - using spec-centric system' };
}

export async function signIn() {
  return { error: 'Authentication disabled - using spec-centric system' };
}
