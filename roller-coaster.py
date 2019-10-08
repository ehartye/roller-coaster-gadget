import time
import logging
import json
import random

from enum import Enum
from agt import AlexaGadget

from ev3dev2.led import Leds
from ev3dev2.sound import Sound
from ev3dev2.motor import OUTPUT_A, SpeedPercent, MediumMotor
from ev3dev2.sensor.lego import ColorSensor

# Set the logging level to INFO to see messages from AlexaGadget
logging.basicConfig(level=logging.INFO)


class MindstormsGadget(AlexaGadget):
    """
    A Mindstorms gadget that activates a roller coaster based on voice commands.
    """

    def __init__(self):
        """
        Performs Alexa Gadget initialization routines and ev3dev resource allocation.
        """
        super().__init__()

        # Ev3dev initialization
        self.leds = Leds()
        self.sound = Sound()
        self.chainLift = MediumMotor(OUTPUT_A)
        self.color = ColorSensor()

    def on_connected(self, device_addr):
        """
        Gadget connected to the paired Echo device.
        :param device_addr: the address of the device we connected to
        """
        self.leds.set_color("LEFT", "GREEN")
        self.leds.set_color("RIGHT", "GREEN")
        print("{} connected to Echo device".format(self.friendly_name))

    def on_disconnected(self, device_addr):
        """
        Gadget disconnected from the paired Echo device.
        :param device_addr: the address of the device we disconnected from
        """
        self.leds.set_color("LEFT", "BLACK")
        self.leds.set_color("RIGHT", "BLACK")
        print("{} disconnected from Echo device".format(self.friendly_name))

    def on_custom_mindstorms_gadget_control(self, directive):
        """
        Handles the Custom.Mindstorms.Gadget control directive.
        :param directive: the custom directive with the matching namespace and name
        """
        try:
            payload = json.loads(directive.payload.decode("utf-8"))
            print("Control payload: {}".format(payload))
            control_type = payload["type"]

            if control_type == "rideStart":

                # Expected params: [lapCount]
                self._startRide(int(payload["lapCount"]))

        except KeyError:
            print("Missing expected parameters: {}".format(directive))


    def _startRide(self,lapCount):
        lapsLeft = lapCount
        while lapsLeft > 0:
            #Cars passing light sensor at base of chain lift hill 
            #signal beginning of lap
            if self.color.reflected_light_intensity > 10: 
                #SpeedPercent(100), 35 required to get cars up chain lift hill
                #and around track bend at top
                self.chainLift.on_for_rotations(SpeedPercent(100), 35) 
                lapsLeft = lapsLeft - 1   
                time.sleep(2)
            time.sleep(.5)        


if __name__ == '__main__':

    # Startup sequence
    gadget = MindstormsGadget()
    gadget.sound.play_song((('C4', 'e'), ('D4', 'e'), ('E5', 'q')))
    gadget.leds.set_color("LEFT", "GREEN")
    gadget.leds.set_color("RIGHT", "GREEN")

    # Gadget main entry point
    gadget.main()

    # Shutdown sequence
    gadget.sound.play_song((('E5', 'e'), ('C4', 'e')))
    gadget.leds.set_color("LEFT", "BLACK")
    gadget.leds.set_color("RIGHT", "BLACK")
