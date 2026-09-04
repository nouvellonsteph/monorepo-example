# Routing engine

This private Worker converts depot parcel metadata into a chute decision. Its Workers Builds watch path is isolated to this directory plus the shared contract and root toolchain files.

Changes here produce an independent build, deployment, and rollback history.
