#include <Wire.h>
#include "DS3231.h"

DS3231 Clock;

RTClib RTC;



struct timeStr {
  int day;
  int hour;
  int minute;
};

struct recordStr {
  int days;
  int hour;
  int minute;
  int duration;
};


struct lineStr {
  int recordNumber;
  struct recordStr rec[8];
};

struct lineStr line[4];
struct timeStr actTime;

void addRecord(int lineNum, struct recordStr rec)
{
  int index = line[lineNum].recordNumber;
  if(index<8){
    line[lineNum].rec[index].days = rec.days;
    line[lineNum].rec[index].hour = rec.hour;
    line[lineNum].rec[index].minute = rec.minute;
    line[lineNum].rec[index].duration = rec.duration;
    line[lineNum].recordNumber++;
  }
}

void printRecords(int lineNum)
{
  int recNum = line[lineNum].recordNumber;
  Serial.print("LINE");
  Serial.println(lineNum);
  if(recNum)
  {
    for(int i=0; i<recNum; i++)
    {
      Serial.print("Nastawa");
      Serial.print(i+1);
      Serial.println(':');
      Serial.println(line[lineNum].rec[i].days);
      Serial.println(line[lineNum].rec[i].hour);
      Serial.println(line[lineNum].rec[i].minute);
      Serial.println(line[lineNum].rec[i].duration);
    }
  }
  else Serial.println("Brak nastaw");
}
void delRecords(int lineNum)
{
  line[lineNum].recordNumber = 0;
}

int compareWithTime(int lineNum, struct timeStr timeNow)
{
  int result = 0;
  for(int i=0; i<line[lineNum].recordNumber; i++)
  {
    uint8_t days = line[lineNum].rec[i].days;
    int hour = line[lineNum].rec[i].hour;
    int minute = line[lineNum].rec[i].minute;
    int duration = line[lineNum].rec[i].duration;
    int daysShifted = (days<<1) + ((days&0x40)>>6);

    if(timeNow.day>0){
      if((0x01<<(timeNow.day-1))&days){
        //nastawa dzisiejsza
        int min = hour*60+minute;
        int max = hour*60+minute+duration;
        int val = timeNow.hour*60+timeNow.minute;
        if((val>=min)&&(val<max)) result=1;
      }
      if((0x01<<(timeNow.day-1))&daysShifted){
        //nastawa wczorajsza
        int min = hour*60+minute;
        int max = hour*60+minute+duration;
        int val = timeNow.hour*60+timeNow.minute+24*60;
        if((val>=min)&&(val<max)) result=1;
      }
    }
  }
  if(result)Serial.println("Zawiera");
  else Serial.println("Nie zawiera");
  return result;
}

struct recordStr tmp;
struct timeStr time1;
void setup () {
    Serial.begin(57600);
    Wire.begin();
    tmp.days = 0x01<<6;
    tmp.hour = 23;
    tmp.minute = 50;
    tmp.duration = 30;
    addRecord(2, tmp);
    time1.day = 1;
    time1.hour = 0;
    time1.minute = 10;
    compareWithTime(2, time1);
    printRecords(2);


}
void loop () {

    delay(1000);

//    DateTime now = RTC.now();
//
//    Serial.print(now.year(), DEC);
//    Serial.print('/');
//    Serial.print(now.month(), DEC);
//    Serial.print('/');
//    Serial.print(now.day(), DEC);
//    Serial.print(' ');
//    Serial.print(now.hour(), DEC);
//    Serial.print(':');
//    Serial.print(now.minute(), DEC);
//    Serial.print(':');
//    Serial.print(now.second(), DEC);
//    Serial.println();
//    Serial.print(Clock.getDoW(), DEC);
//    Serial.println();

}
