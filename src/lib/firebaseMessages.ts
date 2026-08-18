export function getFriendlyErrorMessage(error: any): string {
  if (!error) return 'Ocorreu um erro desconhecido. Tente novamente.';
  
  const errorCode = error.code || error.message;

  if (typeof errorCode !== 'string') {
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }

  if (errorCode.includes('auth/invalid-credential')) {
    return 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
  }
  if (errorCode.includes('auth/email-already-in-use')) {
    return 'Este e-mail já está cadastrado. Tente fazer login ou recupere sua senha.';
  }
  if (errorCode.includes('auth/user-not-found')) {
    return 'Nenhuma conta encontrada com este e-mail.';
  }
  if (errorCode.includes('auth/wrong-password')) {
    return 'Senha incorreta. Tente novamente.';
  }
  if (errorCode.includes('auth/too-many-requests')) {
    return 'Muitas tentativas falhas. Sua conta foi temporariamente bloqueada. Tente novamente mais tarde ou recupere sua senha.';
  }
  if (errorCode.includes('auth/network-request-failed')) {
    return 'Falha na conexão de rede. Verifique sua internet e tente novamente.';
  }
  if (errorCode.includes('auth/weak-password')) {
    return 'A senha é muito fraca. Escolha uma senha mais forte.';
  }
  if (errorCode.includes('auth/popup-closed-by-user')) {
    return 'A janela de login do Google foi fechada antes de concluir.';
  }
  if (errorCode.includes('permission-denied')) {
    return 'Você não tem permissão para realizar esta ação.';
  }
  
  // Se houver uma mensagem de erro original que não seja do Firebase, exiba-a
  if (error.message && !error.message.includes('Firebase')) {
    return error.message;
  }

  return 'Ocorreu um erro interno. Por favor, tente novamente.';
}
