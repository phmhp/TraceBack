#ifndef TRACKBACK_H
#define TRACKBACK_H
/* TRACKBACK reference SW; handwritten, not certified/generated ECU code. */
typedef enum { TB_P, TB_R, TB_N, TB_D } Trackback_Gear;
typedef enum { TB_INVALID, TB_VALID } Trackback_Validity;
typedef enum { TB_NONE, TB_FORWARD, TB_REVERSE } Trackback_Direction;
typedef struct { double magnitude; Trackback_Direction direction; Trackback_Validity validity; } Trackback_Request;
typedef struct {
    double gearChangeMaxSpeed, forwardMapMaximum, forwardMapZeroSpeed;
    double reverseMapMaximum, reverseMapZeroSpeed, forwardLimit, reverseLimit;
} Trackback_Calibration;
typedef struct {
    double acceleratorPedalPosition;
    Trackback_Validity acceleratorPedalValidity;
    Trackback_Gear gearRequest;
    Trackback_Validity gearRequestValidity;
    int vehicleReady, propulsionEnable;
    double longitudinalVelocity, vehicleSpeed;
} Trackback_Input;
typedef struct {
    Trackback_Gear gearState;
    Trackback_Validity gearStateValidity;
    int transitionAccepted, propulsionEnabled;
    Trackback_Request propulsion, driveTorque, eDrive;
} Trackback_Output;
typedef struct { Trackback_Gear previousGear; Trackback_Calibration calibration; int caseVariant; } Trackback_Context;
void Trackback_Init(Trackback_Context*, const Trackback_Calibration*, Trackback_Gear initialGear);
void Trackback_Reset(Trackback_Context*, Trackback_Gear initialGear);
void Trackback_Step(Trackback_Context*, const Trackback_Input*, Trackback_Output*);
void Trackback_GearLogic(Trackback_Context*, const Trackback_Input*, Trackback_Output*);
Trackback_Request Trackback_Propulsion(const Trackback_Input*, const Trackback_Output*);
Trackback_Request Trackback_VMC(Trackback_Request, double speed, const Trackback_Calibration*);
Trackback_Request Trackback_EDrive(Trackback_Request, const Trackback_Calibration*);
/* Reference case variants: 0 normal, 1 scaling defect, 2 compensation, 3 limit removal. */
Trackback_Request Trackback_EDriveCase(Trackback_Request, const Trackback_Calibration*, int);
#endif
