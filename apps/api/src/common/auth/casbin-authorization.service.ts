import { ForbiddenException, Injectable } from '@nestjs/common';
import { newEnforcer, newModelFromString } from 'casbin';
import { AppRole } from './roles.enum';
import { casbinModelText, casbinPolicies } from './casbin-policy';

@Injectable()
export class CasbinAuthorizationService {
  private readonly enforcerPromise = this.buildEnforcer();

  async hasRole(subject: AppRole, requiredRole: AppRole) {
    const enforcer = await this.enforcerPromise;
    return enforcer.enforce(subject, `role:${requiredRole}`, 'use');
  }

  async canPublish(subject: AppRole, scope: 'own' | 'any') {
    const enforcer = await this.enforcerPromise;
    return enforcer.enforce(subject, 'publication', scope);
  }

  async canManageCredential(subject: AppRole, scope: 'own' | 'any') {
    const enforcer = await this.enforcerPromise;
    return enforcer.enforce(subject, 'user-credential', scope);
  }

  async assertPublish(subject: AppRole, scope: 'own' | 'any') {
    if (!(await this.canPublish(subject, scope))) {
      throw new ForbiddenException('Insufficient role for requested publication action');
    }
  }

  async assertCredentialAccess(subject: AppRole, scope: 'own' | 'any') {
    if (!(await this.canManageCredential(subject, scope))) {
      throw new ForbiddenException('Insufficient role for requested credential action');
    }
  }

  private async buildEnforcer() {
    const enforcer = await newEnforcer(newModelFromString(casbinModelText));
    await enforcer.addPolicies(casbinPolicies.filter((policy) => policy[0] === 'p').map(([, ...rule]) => rule));
    await enforcer.addGroupingPolicies(casbinPolicies.filter((policy) => policy[0] === 'g').map(([, ...rule]) => rule));
    return enforcer;
  }
}
