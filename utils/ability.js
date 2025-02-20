import { Ability, AbilityBuilder } from '@casl/ability'

export function defineAbilitiesFor(permissions) {
    const { can, rules } = new AbilityBuilder(Ability)

    // Check if user has the "ADMIN" permission
    const isAdmin = permissions.some((perm) => perm.name === "ADMIN")

    if (isAdmin) {
        can('manage', 'all') // Admin can do everything
    } else {
        // Otherwise, grant specific permissions
        permissions.forEach((permission) => {
            const [action, subject] = permission.name.toLowerCase().split(' ')
            can(action, subject)
        })
    }

    return new Ability(rules)
}