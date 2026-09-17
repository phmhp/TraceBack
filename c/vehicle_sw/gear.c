#include "trackback.h"
/* SYSR-GEAR-001 / SWR-GEAR-001: only accepted requests change previous gear. */
void Trackback_GearLogic(Trackback_Context* ctx, const Trackback_Input* in, Trackback_Output* out) {
    out->gearStateValidity = in->gearRequestValidity;
    out->transitionAccepted = 0;
    if (in->gearRequestValidity == TB_VALID) {
        int opposite = (ctx->previousGear == TB_D && in->gearRequest == TB_R) ||
                       (ctx->previousGear == TB_R && in->gearRequest == TB_D);
        double speed = in->longitudinalVelocity < 0 ? -in->longitudinalVelocity : in->longitudinalVelocity;
        out->transitionAccepted = !opposite || speed <= ctx->calibration.gearChangeMaxSpeed;
        if (out->transitionAccepted) ctx->previousGear = in->gearRequest;
    }
    out->gearState = ctx->previousGear;
}
