export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  isActive?: boolean;
  permissions?: string[];
  mfaEnabled?: boolean;
  mfaSetupRequired?: boolean;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  refreshToken?: string;
  expiresAt?: string;
  requireMfa?: boolean;
  tempToken?: string;
}

export class AuthUserModel {
  public id: number;
  public email: string;
  public name: string;
  public role?: string;
  public avatar?: string;
  public createdAt?: string;
  public updatedAt?: string;
  public lastLoginAt?: string;
  public isActive?: boolean;
  public permissions?: string[];
  public mfaEnabled?: boolean;
  public mfaSetupRequired?: boolean;

  constructor(data: AuthUser) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.role = data.role;
    this.avatar = data.avatar;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.lastLoginAt = data.lastLoginAt;
    this.isActive = data.isActive ?? true;
    this.permissions = data.permissions || [];
    this.mfaEnabled = data.mfaEnabled ?? false;
    this.mfaSetupRequired = data.mfaSetupRequired ?? false;
  }

  public getDisplayName(): string {
    return this.name || this.email;
  }

  public getInitials(): string {
    const name = this.getDisplayName();
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  public hasPermission(permission: string): boolean {
    return this.permissions?.includes(permission) || false;
  }

  public hasRole(role: string): boolean {
    return this.role === role;
  }

  public isAdmin(): boolean {
    return this.hasRole('admin') || this.hasRole('administrator');
  }

  public isMfaEnabled(): boolean {
    return this.mfaEnabled === true;
  }

  public needsMfaSetup(): boolean {
    return this.mfaSetupRequired === true;
  }

  public toJSON(): AuthUser {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      avatar: this.avatar,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
      isActive: this.isActive,
      permissions: this.permissions,
      mfaEnabled: this.mfaEnabled,
      mfaSetupRequired: this.mfaSetupRequired,
    };
  }

  public static fromJSON(data: AuthUser): AuthUserModel {
    return new AuthUserModel(data);
  }
} 