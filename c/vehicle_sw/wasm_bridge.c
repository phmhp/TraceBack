#include "trackback.h"
/* ABI v1: fixed binary64 slots avoid exposing compiler struct padding to JS.
 * One context per WASM instance. Callers validate contracts before entering C. */
static Trackback_Context context;
static double input[8], output[13], calibration[7];
unsigned tb_abi(void) { return 1; }
unsigned tb_input_count(void) { return 8; }
unsigned tb_output_count(void) { return 13; }
unsigned tb_calibration_count(void) { return 7; }
double* tb_input(void) { return input; }
double* tb_output(void) { return output; }
double* tb_calibration(void) { return calibration; }
void tb_init(int initialGear) {
    Trackback_Calibration cal = {calibration[0],calibration[1],calibration[2],calibration[3],calibration[4],calibration[5],calibration[6]};
    Trackback_Init(&context, &cal, (Trackback_Gear)initialGear);
}
void tb_reset(int initialGear) { Trackback_Reset(&context, (Trackback_Gear)initialGear); }
void tb_case_variant(int variant) { context.caseVariant = variant >= 0 && variant <= 3 ? variant : 0; }
static void write_request(unsigned offset, Trackback_Request request) {
    output[offset] = request.magnitude; output[offset+1] = request.direction; output[offset+2] = request.validity;
}
void tb_step(void) {
    Trackback_Input in = {input[0], (Trackback_Validity)input[1], (Trackback_Gear)input[2],
        (Trackback_Validity)input[3], (int)input[4], (int)input[5], input[6], input[7]};
    Trackback_Output out;
    Trackback_Step(&context, &in, &out);
    output[0] = out.gearState; output[1] = out.gearStateValidity;
    output[2] = out.transitionAccepted; output[3] = out.propulsionEnabled;
    write_request(4,out.propulsion); write_request(7,out.driveTorque); write_request(10,out.eDrive);
}
/* Component verification entry points use the identical production functions. */
void tb_test_vmc(double magnitude, int direction, int validity, double speed) {
    Trackback_Request request = {magnitude, (Trackback_Direction)direction, (Trackback_Validity)validity};
    write_request(7, Trackback_VMC(request, speed, &context.calibration));
}
void tb_test_edrive(double magnitude, int direction, int validity) {
    Trackback_Request request = {magnitude, (Trackback_Direction)direction, (Trackback_Validity)validity};
    write_request(10, Trackback_EDriveCase(request, &context.calibration, context.caseVariant));
}
