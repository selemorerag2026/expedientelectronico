# Skills del proyecto

Cada skill que el usuario comparta se guarda aquí, en su propia carpeta:

```
.claude/skills/
  nombre-del-skill/
    SKILL.md
    (archivos de soporte, si aplica)
```

`SKILL.md` debe empezar con frontmatter:

```markdown
---
name: nombre-del-skill
description: Qué hace y cuándo usarlo (esto es lo que decide si se activa).
---

Contenido / instrucciones del skill...
```

Estos skills quedan disponibles como `/nombre-del-skill` dentro de este repo.
