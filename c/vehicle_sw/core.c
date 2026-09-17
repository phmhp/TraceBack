#include "trackback.h"
void Trackback_Reset(Trackback_Context* ctx, Trackback_Gear initialGear) { ctx->previousGear = initialGear; ctx->caseVariant = 0; }
void Trackback_Init(Trackback_Context* ctx, const Trackback_Calibration* calibration, Trackback_Gear initialGear) {
    ctx->calibration = *calibration;
    Trackback_Reset(ctx, initialGear);
}
void Trackback_Step(Trackback_Context* ctx, const Trackback_Input* in, Trackback_Output* out) {
    Trackback_GearLogic(ctx, in, out);
    out->propulsionEnabled = in->vehicleReady && in->propulsionEnable;
    out->propulsion = Trackback_Propulsion(in, out);
    out->driveTorque = Trackback_VMC(out->propulsion, in->vehicleSpeed, &ctx->calibration);
    out->eDrive = Trackback_EDriveCase(out->driveTorque, &ctx->calibration, ctx->caseVariant);
}
